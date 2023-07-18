
// loads environment variables from a .env file
require('dotenv').config({ path: '../../.env' });

// utility library
const _ = require('lodash');

// send email through Sendgrid 
const sendgrid = require('@sendgrid/mail');

// universal logging library
const winston = require('winston');

// configure winston logging
const logConfiguration = {
	'transports': [
		new winston.transports.File({
			filename: './logs/routes/ajax.log',
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

// set Sendgrid Api Key
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);


module.exports = (app, knex) => {

	/***************************************************** Navigation Ajax Search *****************************************************/

	app.post('/ajax-search', async (req, res) => {
		let performers = [];
		let venues = [];

		/*
		 * _.uniqWith() get the unique items in an array by a comparator
		 * , in the 2nd position, thats called to compare elements of the array
		 * in this case, its _.isEqual() to check all the objects for duplicate objects
		*/
		await knex.select('performer_slug', 'name')
			.from('stub_performers')
			.whereRaw("name LIKE '%" + req.body.searchVal + "%'")
			.limit(6)
			.then(performs => _.uniqWith(performs, _.isEqual).forEach(performer => performers.push('<a class="search-item" href="' + process.env.SITE_URL + '/tickets/' + performer.performer_slug + '" onmouseover="makeSearchItemActive(this);">' + performer.name + '</a>')))
			.catch(err => logger.error('error with performers', err));

		/*
		 * _.uniqWith() get the unique items in an array by a comparator
		 * , in the 2nd position, thats called to compare elements of the array
		 * in this case, its _.isEqual() to check all the objects for duplicate objects
		*/
		await knex.select('venue_name', 'venue_slug')
			.from('stub_venues')
			.whereRaw("venue_name LIKE '%" + req.body.searchVal + "%'")
			.limit(6)
			.then(vens => _.uniqWith(vens, _.isEqual).forEach(venue => venues.push('<a class="search-item" href="' + process.env.SITE_URL + '/venue/' + venue.venue_slug + '" onmouseover="makeSearchItemActive(this);">' + venue.venue_name + '</a>')))
			.catch(err => logger.error('error with venues', err));

		res.send({ performers, venues });
	});



	/***************************************************** Home Ajax Search *****************************************************/

	app.post('/ajax-home-search', async (req, res) => {
		let performers = [];
		let venues = [];

		/*
		 * _.uniqWith() get the unique items in an array by a comparator
		 * , in the 2nd position, thats called to compare elements of the array
		 * in this case, its _.isEqual() to check all the objects for duplicate objects
		*/
		await knex.select('performer_slug', 'name')
			.from('stub_performers')
			.whereRaw("name LIKE '%" + req.body.searchVal + "%'")
			.limit(6)
			.then(performs => _.uniqWith(performs, _.isEqual).forEach(performer => performers.push('<a class="search-item" href="' + process.env.SITE_URL + '/tickets/' + performer.performer_slug + '" onmouseover="makeHomeSearchItemActive(this);">' + performer.name + '</a>')))
			.catch(err => logger.error('error with performers', err));

		/*
		 * _.uniqWith() get the unique items in an array by a comparator
		 * , in the 2nd position, thats called to compare elements of the array
		 * in this case, its _.isEqual() to check all the objects for duplicate objects
		*/
		await knex.select('venue_name', 'venue_slug')
			.from('stub_venues')
			.whereRaw("venue_name LIKE '%" + req.body.searchVal + "%'")
			.limit(6)
			.then(vens => _.uniqWith(vens, _.isEqual).forEach(venue => venues.push('<a class="search-item" href="' + process.env.SITE_URL + '/venue/' + venue.venue_slug + '" onmouseover="makeHomeSearchItemActive(this);">' + venue.venue_name + '</a>')))
			.catch(err => logger.error('error with venues', err));

		res.send({ performers, venues });
	});



	/***************************************************** Navigation Ajax Search *****************************************************/

	app.post('/ajax-search-location', async (req, res) => {
		let locations = [];

		/*
		 * _.uniqWith() get the unique items in an array by a comparator
		 * , in the 2nd position, thats called to compare elements of the array
		 * in this case, its _.isEqual() to check all the objects for duplicate objects
		*/
		await knex('stub_city')
			.whereRaw("city LIKE '%" + req.body.searchVal + "%'")
			.limit(10)
			.then(locationArr => _.uniqWith(locationArr, _.isEqual).forEach(location => locations.push('<a class="location-item" href="' + process.env.SITE_URL + '?zipcode=' + location.zipcode + '" onmouseover="makeLocationItemActive(this);">' + location.city + ", " + location.state + '</a>')))
			.catch(err => logger.error('error with performers', err));

		res.send(locations);
	});

	/***************************************************** Sendgrid Mail *****************************************************/

	app.post('/ajax/submit-contact-form', async (req, res) => {
		if (Object.keys(req.body).length === 4) {
			const contactForm = {
				to: (process.env.NODE_ENV === 'production') ? req.body.to + '@stubboxoffice.com' : 'bernin@twowords.co',
				from: 'contactforms@stubboxoffice.com',
				subject: 'Stub Boxoffice Contact Submission Form',
				text: `Name ${req.body.name} -- Email:  ${req.body.email} -- Message: ${req.body.message}`,
				html: `<p> Name: ${req.body.name} </p> <p> Email: ${req.body.email} </p> <p> ${req.body.message} </p>`,
			};
			
			sendgrid.send(contactForm);

			res.status(200).json({ error: false, message: `Your message to the ${req.body.to} was sent. Thank you.` });
		} else {
			res.status(200).json({ error: true, message: `Please fill out all the fields. Thank you.` });
		}
	});

}
