
// loads environment variables from a .env file
require('dotenv').config({ path: '../../.env' });

// universal logging library
const winston = require('winston');

// configure winston logging
const logConfiguration = {
	'transports': [
		new winston.transports.File({
			filename: './logs/routes/errors.log',
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

	/***************************************************** 500 - Internal Server Error *****************************************************/

	app.use((err, req, res, next) => {
console.log(err);
		const meta = { page_title: "500 Server Error | Stub Boxoffice" };

		const css = [
			home_url + "/public/css/main.css",
			home_url + "/public/css/error.css"
		];

		const js = [];

		const error_message = err.message || "I'm afraid something went wrong.";

		res.status(500);
		res.render('pages/errors/500', { meta, css, js, home_url, header_img: home_url + "/public/img/header/header-img-other.jpg", error_message, is_production: process.env.NODE_ENV === 'production' ? true : false , url: ''})
	});

	/***************************************************** 404 - Not Found *****************************************************/

	app.use((req, res) => {
		const meta = { page_title: "404 Page Not Found | Stub Boxoffice" };

		const css = [
			home_url + "/public/css/main.css",
			home_url + "/public/css/error.css"
		];

		const js = [];
        res.redirect('/');
		//res.status(404);

		//res.render('pages/errors/404', { meta, css, js, home_url, header_img: home_url + "/public/img/header/header-img-other.jpg", is_production: process.env.NODE_ENV === 'production' ? true : false })
	});

}
