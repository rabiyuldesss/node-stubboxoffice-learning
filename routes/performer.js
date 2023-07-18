
// loads environment variables from a .env file
require('dotenv').config({ path: '../../.env' });

// promise based HTTP client
const axios = require('axios');

// xml to json converter
const x2j = require('rapidx2j');

// universal logging library
const winston = require('winston');

// configure winston logging
const logConfiguration = {
	'transports': [
		new winston.transports.File({
			filename: './logs/routes/performer.log',
			maxFiles: 5,
			maxsize:'25000000', // 25MB
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
const logger = winston.createLogger(logConfiguration);

// get the home/site url from .env
const home_url = process.env.SITE_URL;


module.exports = (app, knex) => {

	/***************************************************** Performer Singles *****************************************************/

	app.get("/tickets/:performer_slug", async (req, res, next) => {
		const user_zipcode = res.locals.user_zip || req.cookies.stub_user_zipcode;
		const user_location = res.locals.user_addr ? JSON.parse(req.cookies.stub_user_addr) : '';

		let performer_arr;
		let similar_performers;
		let events_list = [];
		let local_events_list = [];

		// category top level header images
		const header_img = {
			"1": home_url + "/public/img/header/header-img-sports.jpg",
			"2": home_url + "/public/img/header/header-img-concerts.jpg",
			"3": home_url + "/public/img/header/header-img-theatre.jpg",
			"4": home_url + "/public/img/header/header-img-other.jpg"
		}

		// For Ticket Network SOAP Requests
		const tnurl = process.env.TICKET_NETWORK_BASE_API_URL; // 'http://tnwebservices-test.ticketnetwork.com/tnwebservice/v3.2/tnwebservicestringinputs.asmx'
		const headers = {
			'Host': process.env.TICKET_NETWORK_HOST_URL, // 'tnwebservices-test.ticketnetwork.com'
			'Content-Type': 'text/xml; charset=utf-8',
			'SOAPAction': process.env.TICKET_NETWORK_SOAP_ACTION_BASE + "/GetEvents"
		};
		let xml = "";


		// get performer data
		await knex('stub_performers')
			.where({ performer_slug: req.params.performer_slug })
			.then(performs => {
				if (performs !== undefined && performs.length !== 0) {
					performer = performs[0];
				} else {
					return next(); // should lead to 404
				}
			})
			.catch(err => next(new Error('Having trouble getting the requested performer.'))); // should lead to 500

		// next() inside of nested async function leads to error:
		// `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
		if (res.headersSent) {
			return;
		}

		// get 5 similar performers
		await knex('stub_high_sales_performers')
			.whereRaw('`parent_cat_id` = ? AND `child_cat_id` = ? order by percent asc limit 10', [performer.parent_cat_id, performer.child_cat_id])
			.then(performs => similar_performers = performs)
			.catch(err => logger.error(err));




		// local events XML for Ticket Network
		xml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEvents xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>${process.env.TICKET_NETWORK_WEBCONFIG_ID}</websiteConfigID><performerID>${performer.performer_id}</performerID><numberOfEvents>5</numberOfEvents><stateProvDesc>${user_location.state}</stateProvDesc><orderByClause>Date</orderByClause></GetEvents></soap:Body></soap:Envelope>`;

		// Build the Ticket Network SOAP request with axios
		await axios.post(tnurl, xml, { headers: headers })
			.then(response => {
				// return { headers: response.headers, body: response.data, statusCode: response.status };
				const json = x2j.parse(response.data);

				if (typeof json['soap:body'].geteventsresponse.geteventsresult.event === 'undefined') {
					local_events_list = [];
				} else if (Array.isArray(json['soap:body'].geteventsresponse.geteventsresult.event)) {
					local_events_list = json['soap:body'].geteventsresponse.geteventsresult.event;
				} else {
					local_events_list.push(json['soap:body'].geteventsresponse.geteventsresult.event);
				}
			})
			.catch(err => {
				if (Object.keys(performer).length > 0) {
					return logger.error(`Error getting LOCAL events for the performer ${performer.name}.`, err);
				} else {
					return logger.error('Error getting LOCAL events for a performer.');
				}
			});

		// all events XML for Ticket Network
		xml = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEvents xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>' + process.env.TICKET_NETWORK_WEBCONFIG_ID + '</websiteConfigID><performerID>' + performer.performer_id + '</performerID><orderByClause>Date</orderByClause></GetEvents></soap:Body></soap:Envelope>';

		// Build the Ticket Network SOAP request with axios
		await axios.post(tnurl, xml, { headers: headers })
			.then(response => {
				// return { headers: response.headers, body: response.data, statusCode: response.status };
				const json = x2j.parse(response.data);

				if (typeof json['soap:body'].geteventsresponse.geteventsresult.event === 'undefined') {
					events_list = [];
				} else if (Array.isArray(json['soap:body'].geteventsresponse.geteventsresult.event)) {
					events_list = json['soap:body'].geteventsresponse.geteventsresult.event;
				} else {
					events_list.push(json['soap:body'].geteventsresponse.geteventsresult.event);
				}
			})
			.catch(err => {
				if (Object.keys(performer).length > 0) {
					return logger.error(`Error getting ALL events for the performer ${performer.name}.`, err);
				} else {
					return logger.error('Error getting ALL events for a performer.');
				}
			});






		let meta = { page_title: performer.name + " Tickets | Stub Box Office", page_name: 'performer' };


		const css = [
			"https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.css",
			home_url + "/public/css/main.css",
			home_url + "/public/css/performer.css"
		];
		const js = [
			'https://cdn.jsdelivr.net/jquery/latest/jquery.min.js',
			home_url + '/public/js/lib/pagination.js',
			'https://cdn.jsdelivr.net/momentjs/latest/moment.min.js',
			'https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js',
			home_url + '/public/js/search.js',
		];

		res.render('pages/performer', { meta, css, js, home_url, header_img: header_img[performer.parent_cat_id], performer: performer, performer_arr, local_events_list, events_list, similar_performers, user_zipcode, user_location, url: '' });
	});






	/***************************************************** Performer Tickets *****************************************************/

	app.get("/event/:event_id", async(req, res, next) => {
		let event = [];
		let performer = {};

		// category top level header images
		const header_img = home_url + "/public/img/header/header-img-sports.jpg";

		// get the information using SOAP
		const tnurl = process.env.TICKET_NETWORK_BASE_API_URL; // 'http://tnwebservices-test.ticketnetwork.com/tnwebservice/v3.2/tnwebservicestringinputs.asmx'
		const headers = {
			'Host': process.env.TICKET_NETWORK_HOST_URL, // 'tnwebservices-test.ticketnetwork.com'
			'Content-Type': 'text/xml; charset=utf-8',
			'SOAPAction': process.env.TICKET_NETWORK_SOAP_ACTION_BASE + "/GetEvents"
		};

		// single event XML for Ticket Network
		const xml = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEvents xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>' + process.env.TICKET_NETWORK_WEBCONFIG_ID + '</websiteConfigID><eventID>' + req.params.event_id + '</eventID></GetEvents></soap:Body></soap:Envelope>';

		// Build the Ticket Network SOAP request with axios
		await axios.post(tnurl, xml, { headers: headers })
			.then(response => {
				// return { headers: response.headers, body: response.data, statusCode: response.status };
				const json = x2j.parse(response.data);

				if (typeof json['soap:body'].geteventsresponse.geteventsresult.event === 'undefined') {

				} else if (Array.isArray(json['soap:body'].geteventsresponse.geteventsresult.event)) {
					event = json['soap:body'].geteventsresponse.geteventsresult.event[0];
				} else {
					event = json['soap:body'].geteventsresponse.geteventsresult.event;
				}
			})
			.catch(err => {
				if (Object.keys(performer).length > 0) {
					return logger.error(`Error getting ALL events for the performer .`, err);
					next(new Error(`Had some trouble getting the requested event for ${performer.name}. Please refresh or try again later.`));
				} else {
					return logger.error('Error getting ALL events for a performer.', err);
					next(new Error('Had some trouble getting the requested event. Please refresh or try again later.'));
				}
			});

		// next() inside of nested async function leads to error:
		// `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
		if (res.headersSent) {
			return;
		}

		const css = [ home_url + "/public/css/tickets-main.css", home_url + "/public/css/event.css" ];
		let meta = { page_title: Object.keys(event).length === 0 ? "Event Tickets | Stub Boxoffice" : event.name + " | Stub Boxoffice" };
		const js = [];

		res.render('pages/event', { meta, css, js, home_url, header_img, event_id: req.params.event_id, ticketnetwork_id: process.env.TICKET_NETWORK_WEBCONFIG_ID, event, performer, url: '' });
	});






	/***************************************************** Venue Tickets *****************************************************/

	app.get("/venue/:venue_slug", async(req, res, next) => {
		let event = [];
		let venue = {};

		// get the information using SOAP
		const tnurl = process.env.TICKET_NETWORK_BASE_API_URL; // 'http://tnwebservices-test.ticketnetwork.com/tnwebservice/v3.2/tnwebservicestringinputs.asmx'
		const headers = {
			'Host': process.env.TICKET_NETWORK_HOST_URL, // 'tnwebservices-test.ticketnetwork.com'
			'Content-Type': 'text/xml; charset=utf-8',
			'SOAPAction': process.env.TICKET_NETWORK_SOAP_ACTION_BASE + "/GetEvents"
		};

		await knex('stub_venues')
			.where({ venue_slug: req.params.venue_slug })
			.limit(1)
			.then(async ven => {
				if (ven !== undefined && ven.length !== 0) {
					venue = ven[0];

					const xml = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEvents xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>' + process.env.TICKET_NETWORK_WEBCONFIG_ID + '</websiteConfigID><venueID>' + venue.venue_id + '</venueID><orderByClause>Date</orderByClause></GetEvents></soap:Body></soap:Envelope>';

					// Build the Ticket Network SOAP request with axios
					await axios.post(tnurl, xml, { headers: headers })
						.then(response => {
							const json = x2j.parse(response.data);

							if (typeof json['soap:body'].geteventsresponse.geteventsresult.event === 'undefined') {

							} else if (Array.isArray(json['soap:body'].geteventsresponse.geteventsresult.event)) {
								event = json['soap:body'].geteventsresponse.geteventsresult.event;
							} else {
								event.push(json['soap:body'].geteventsresponse.geteventsresult.event);
							}
						})
						.catch(err => {
							if (Object.keys(venue).length > 0) {
								return logger.error(`Error getting ALL events for the performer .`, err);
								next(new Error(`Had some trouble getting the events for the requested ${venue.name}. Please refresh or try again later.`));
							} else {
								return logger.error('Error getting ALL events for a performer.', err);
								next(new Error('Had some trouble getting the events for the requested venue. Please refresh or try again later.'));
							}
						});

				} else {
					next();
				}
			})
			.catch(err => next(new Error('Had some trouble getting the venue information.')));

		// next() inside of nested async function leads to error:
		// `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
		if (res.headersSent) {
			return;
		}


		let meta = { page_title: venue.venue_name + " Tickets | Stub Boxoffice" };

		const css = [
			"https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.css",
			home_url + "/public/css/main.css",
			home_url + "/public/css/performer.css"
		];
		const js = [
			'https://cdn.jsdelivr.net/jquery/latest/jquery.min.js',
			home_url + '/public/js/lib/pagination.js',
			'https://cdn.jsdelivr.net/momentjs/latest/moment.min.js',
			'https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js',
			home_url + '/public/js/search.js',
		];

		res.render('pages/venue', { meta, css, js, home_url, header_img: home_url + "/public/img/header/header-img-sports.jpg", venue, event, url: '' });
	});

}

