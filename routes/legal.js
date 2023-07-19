
// loads environment variables from a .env file
require('dotenv').config({ path: '../../.env' });

// universal logging library
const winston = require('winston');

// configure winston logging
const logConfiguration = {
	'transports': [
		new winston.transports.File({
			filename: './logs/routes/legal.log',
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

module.exports = app => {

	/***************************************************** Privacy Policy *****************************************************/

	app.get('/legal/privacy', (req, res) => {
		const meta = { page_title: "Privacy Policy | Stub Boxoffice" };
		const css = [ home_url + "/public/css/main.css", home_url + "/public/css/legal.css" ];
		const js = [];

		res.render('pages/legal/privacy', { meta, css, js, home_url, header_img: home_url + "/public/img/header/header-img-theatre.jpg", bid: process.env.TICKET_NETWORK_WEBCONFIG_BID, site_num: process.env.TICKET_NETWORK_WEBCONFIG_SITE_NUMBER , url: ''});
	});






	/***************************************************** Terms & Conditions *****************************************************/

	app.get('/legal/terms', (req, res) => {
		const meta = { page_title: "Terms & Conditions | Stub Boxoffice" };
		const css = [ home_url + "/public/css/main.css", home_url + "/public/css/legal.css" ];
		const js = [];

		res.render('pages/legal/terms', { meta, css, js, home_url, header_img: home_url + "/public/img/header/header-img-theatre.jpg", bid: process.env.TICKET_NETWORK_WEBCONFIG_BID, site_num: process.env.TICKET_NETWORK_WEBCONFIG_SITE_NUMBER , url: ''});
	});

}
