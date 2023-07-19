
// load all the application enviornment variables
require('dotenv').config({ path: '../../.env' });

// ajax library
const axios = require('axios');

// for logging error messages and selected app messages
const winston = require('winston');

// Fetches the list of bot user-agents from `http://www.user-agents.org/allagents.xml`. Returns true if bot else false not
const botDetect = require('bot-detector');

// configure winston logging
const ticketNetworkLogConfiguration = {
	'transports': [
		new winston.transports.File({
			filename: './logs/middleware/location.log',
			format: winston.format.combine(
				winston.format.timestamp({
					format: 'YYYY-MM-DD hh:mm:ss A ZZ'
				}),
				winston.format.json()
			),
		})
	]
}

// create the winston logger
const logger = winston.createLogger(ticketNetworkLogConfiguration);


module.exports = async (req, res, next) => {

	// if on the / (homepage) or /tickets (performer) page
	if (req.path === '/' || /\/tickets/i.test(req.path)) {
		// check if the user is a bot with a regex and then an npm package
		if (!(/bot|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex/i.test(req.headers['user-agent'])) && !botDetect.isBot(req.headers['user-agent'])) {
		// probably not a bot so continue 

			// if there ISN'T a zipcode change request && the cookies ARE set
			if (req.query.zipcode === undefined && (req.cookies.stub_user_addr && req.cookies.stub_user_zipcode)) {
				// // && if not in production, log the results
				// if (process.env.NODE_ENV !== 'production') { console.log("LOCATION: NO SEARCHING"); }
			
			// if there IS a zipcode change request || cookies AREN'T set
			} else {
				// // && if not in production, log the results
				// if (process.env.NODE_ENV !== 'production') { console.log("LOCATION: SEARCHING"); }

				// For user location lookup
				const cookie_zipcode = req.cookies.stub_user_zipcode;
				const query_zipcode = req.query.zipcode;


				if (process.env.NODE_ENV == 'production') {
					ip_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

					const ip_regex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/; // http://www.regular-expressions.info/examples.html

					// use regex to extract ip address and get the first item
					const ip_regex_results = ip_addr.match(ip_regex);
					// get the first instance
					ip_addr = ip_regex_results[0];
				
				} else {
					// ip_addr = '96.242.234.3'; // office
					// ip_addr = '72.225.143.2'; // home
					ip_addr = '107.152.104.227'; // jersey city
					// console.log("in" + process.env.NODE_ENV);
					// console.log(process.env.NODE_ENV + " ip set to 'Jersey City, NJ': " + ip_addr);
				}


				// if not set and not given
				if ((cookie_zipcode === undefined && (query_zipcode === '' || query_zipcode === undefined)) || req.cookies.stub_user_addr === undefined) {
					// lookup IP address with 'ipdata.co'
					await axios.get(process.env.IP_LOCATE_URL + '/' + ip_addr + '?api-key=' + process.env.IP_LOCATE_API_KEY)
						.then(response => {
							const cookie_json_loc = { city: response.data.city, state: response.data.region_code, country: response.data.country_code };
							const cookie_json_location_str = JSON.stringify({ city: response.data.city, state: response.data.region_code, country: response.data.country_code });

							res.cookie('stub_user_addr', cookie_json_location_str, { maxAge: 2147483647, httpOnly: true });
							res.cookie('stub_user_zipcode', response.data.postal, { maxAge: 2147483647, httpOnly: true });

							res.locals.user_addr = cookie_json_loc;
							res.locals.user_zip = response.data.postal;
						})
						.catch(err => {
							logger.error('error while getting user location', err);
						});
				
				// else if zipcode is explicitly given
				} else if (query_zipcode != '' && query_zipcode != undefined && req.cookies.stub_user_zipcode != query_zipcode) {
					// lookup zipcode with 'here.com'
					await axios.get(process.env.GEOCODER_API_URL + '?app_id=' + process.env.GEOCODER_API_APP_ID + '&app_code=' + process.env.GEOCODER_API_APP_CODE + '&searchtext=USA%20' + query_zipcode)
						.then(response => {
							const addr_res = response.data.Response.View[0].Result[0].Location.Address;
							const addr_location = { city: addr_res.City, state: addr_res.State, country: addr_res.Country };

							res.cookie('stub_user_addr', JSON.stringify(addr_location), { maxAge: 2147483647, httpOnly: true });
							res.cookie('stub_user_zipcode', addr_res.PostalCode, { maxAge: 2147483647, httpOnly: true });

							res.locals.user_addr = addr_location;
							res.locals.user_zip = addr_res.PostalCode;
						})
						.catch(err => {
							logger.error('error while getting user location', err);
						});
				}
			}

		} else {
			// it's probably a bot
		}
	}

	next();
}
	
