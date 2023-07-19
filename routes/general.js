
// loads environment variables from a .env file
require('dotenv').config({ path: '../../.env' });

// Promise based HTTP client
const axios = require('axios');

// utility library
const _ = require('lodash');

// xml to json converter
const x2j = require('rapidx2j');

// slug for slugifying the names/descriptions from ticket network
const slug = require('slug');

// universal logging library
const winston = require('winston');

// configure winston logging
const logConfiguration = {
	'transports': [
		new winston.transports.File({
			filename: './logs/routes/general.log',
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

const page_name = "home";


module.exports = (app, knex) => {

	/***************************************************** Homepage *****************************************************/

	app.get('/', async (req, res) => {
		let location = null;
		let loc_zip = null;
		let loc_county = null;
		// if false, hides the `Now Trending` results in the slider as there are no local results
		let are_results_localized = true;
		let page_desc = null;

		let img_slider = [];
		let top_performers = [];
		let sub_top_performers = { 1: [], 2: [], 3: [], 4: [] }
		let local_events = { "sports": [], "concerts": [], "theatre": [], "other": [] };
		let cat_slider = {};

		const meta = { page_title: "Ticket Resell | Concerts, Sports, Theater | Stub Box Office", page_name: "home" };

		const css = [
			'https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.css',
			home_url + "/public/css/main.css",
			home_url + "/public/css/home.css"
		];
		const js = [
			'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.0/jquery.min.js',
			'https://cdnjs.cloudflare.com/ajax/libs/jquery-migrate/1.2.1/jquery-migrate.min.js',
			'https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.js',
			home_url + "/public/js/home.min.js"
		];


		// get the users `state` location from the middleware or from cookies
		if (res.locals.user_addr) {
			location = res.locals.user_addr;
		} else if (req.cookies.stub_user_addr) {
			location = JSON.parse(req.cookies.stub_user_addr);
		}

		// get the users `zipcode` from the middleware or from cookies
		if (res.locals.user_zip) {
			loc_zip = res.locals.user_zip;
		} else if (req.cookies.stub_user_zipcode) {
			loc_zip = req.cookies.stub_user_zipcode;
		}



		// get top 6 performers
		await knex('stub_top_performers')
			.join('stub_performers', 'stub_top_performers.performer_id', '=', 'stub_performers.performer_id')
			.then(top => top.forEach(performer => {
				if (_.findIndex(top_performers, { 'performer_id': performer.performer_id, slug: performer.performer_slug }) === -1) {
					top_performers.push({
						performer_id: performer.performer_id,
						name: performer.name,
						slug: performer.performer_slug,
						image: performer.featured_image_link
					});
				}
			}))
			.catch(err => logger.error('Error getting featured events under the sports category.', err));



		// get the rest of the other top performers from each parent category
		await knex('stub_sub_top_performers')
			.join('stub_performers', 'stub_sub_top_performers.performer_id', '=', 'stub_performers.performer_id')
			.orderBy('percent')
			.then(top => top.forEach(performer => {
				if (
					// check for duplicates in top performer module
					(_.findIndex(top_performers, { 'performer_id': performer.performer_id, slug: performer.performer_slug }) === -1) &&
					// check if performer already included under nested obj array based on `parent_cat_id`
					(_.findIndex(sub_top_performers[performer.parent_cat_id], { 'performer_id': performer.performer_id, slug: performer.performer_slug }) === -1)
				) {
					sub_top_performers[performer.parent_cat_id].push({
						performer_id: performer.performer_id,
						name: performer.name,
						slug: performer.performer_slug,
						image: performer.featured_image_link
					});
				}
			}))
			.catch(err => logger.error('Error getting featured events under the sports category.', err));



		// get page data
		await knex('stub_pages')
			.where({slug: "home"})
			.limit(1)
			.then(page => page_desc = {title: page[0].desc_title, text: page[0].desc_text})
			.catch(err => logger.error('Error getting the homepage banners.', err));

		// if zipcode && location are set
		if (loc_zip || (location && location.state && location.city) || (location && location.state)) {
			// get county by zipcode
			await knex('stub_zip_county')
				.where({ zipcode: loc_zip })
				.limit(1)
				.then(async res => {
					if (res.length > 0) {
						loc_county = res[0].county;
					} else {

						// get county by city/state
						await knex('stub_zip_county')
							.where({ city: location.city, state: location.state })
							.limit(1)
							.then(async res => {
								if (res.length > 0) {
									loc_county = res[0].county;
								} else {

									// get county at random in state
									await knex('stub_zip_county')
										.where({ state: location.state })
										.limit(1)
										.then(res => {
											loc_county = res[0].county
										})
										.catch(err => logger.error('Error getting a zipcode-county association.', err));
								}
							})
							.catch(err => logger.error('Error getting a zipcode-county association.', err));
					}
				})
				.catch(err => logger.error('Error getting a zipcode-county association.', err));
		}

		await knex('stub_categories')
			.whereRaw('`parent_cat_id` = ? AND `is_featured` = true', [1])
			.then(sports => cat_slider['sports'] = sports)
			.catch(err => logger.error('Error getting featured events under the sports category.', err));

		await knex('stub_categories')
			.whereRaw('`parent_cat_id` = ? AND `is_featured` = true', [2])
			.then(concert => cat_slider['concert'] = concert)
			.catch(err => logger.error('Error getting featured events under the concert category.', err));

		await knex('stub_categories')
			.whereRaw('`parent_cat_id` = ? AND `is_featured` = true', [3])
			.then(theatre => cat_slider['theatre'] = theatre)
			.catch(err => logger.error('Error getting featured events under the theatre category.', err));

		// get the generated local events if the county was generated
		if (location && location.state && loc_county) {

			/* Get cached localized results from Ticket Network */
			const state_events = await knex('stub_zip_events')
				.where({ county: loc_county, state: location.state })
				.limit(1)
				.then(result => result[0])
				.catch(err => {
					logger.error(`Error getting LOCAL events for the concerts category local events in state ${location.state}`, err);
					return { sports: null, concerts: null, theatre: null, other: null };
				});



			// if the sports category isn't null
			local_events['sports'] = state_events && state_events['sports'] !== null ? JSON.parse(state_events['sports']) : [];
			// if the concerts category isn't null
			local_events['concerts'] = state_events && state_events['concerts'] !== null ? JSON.parse(state_events['concerts']) : [];
			// if the theatre category isn't null
			local_events['theatre'] = state_events && state_events['theatre'] !== null ? JSON.parse(state_events['theatre']) : [];
			// if the other category isn't null
			local_events['other'] = state_events && state_events['sports'] !== null ? JSON.parse(state_events['other']) : [];


			// send response when finished getting local events from ticket network and caching in redis
			res.render('pages/home', { meta, css, js, home_url, are_results_localized, page_desc, img_slider, cat_slider, local_events, location, top_performers, sub_top_performers, page_name, url: '' });

		} else {
			// if false, hides the `Now Trending` results in the slider as there are no local results
			are_results_localized = false;
			res.render('pages/home', { meta, css, js, home_url, are_results_localized, page_desc, img_slider, cat_slider, local_events, location, top_performers, sub_top_performers, page_name, url: '' });
		}
	});






	/***************************************************** Contact Page *****************************************************/

	app.get('/contact', (req, res) => {
		const meta = { page_title: "Contact Us | Stub Boxoffice" };
		const css = [ home_url + "/public/css/main.css", home_url + "/public/css/main.css", home_url + "/public/css/contact.css" ];
		const js = [];

		res.render('pages/contact', { meta, css, js, home_url, header_img: home_url + "/public/img/header/header-img-other.jpg", url: '' });
	});

	/** Mega Menu Page */

	app.get('/mega-menu', async (req, res) => {
		let location = null;
		let loc_zip = null;
		let loc_county = null;
		// if false, hides the `Now Trending` results in the slider as there are no local results
		let are_results_localized = true;
		let page_desc = null;

		let img_slider = [];
		let top_performers = [];
		let sub_top_performers = { 1: [], 2: [], 3: [], 4: [] }
		let local_events = { "sports": [], "concerts": [], "theatre": [], "other": [] };
		let cat_slider = {};

		const meta = { page_title: "Ticket Resell | Concerts, Sports, Theater | Stub Box Office", page_name: "home" };

		const css = [
			'https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.css',
			home_url + "/public/css/main.css",
			home_url + "/public/css/home.css"
		];
		const js = [
			'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.0/jquery.min.js',
			'https://cdnjs.cloudflare.com/ajax/libs/jquery-migrate/1.2.1/jquery-migrate.min.js',
			'https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.js',
			home_url + "/public/js/home.min.js"
		];


		// get the users `state` location from the middleware or from cookies
		if (res.locals.user_addr) {
			location = res.locals.user_addr;
		} else if (req.cookies.stub_user_addr) {
			location = JSON.parse(req.cookies.stub_user_addr);
		}

		// get the users `zipcode` from the middleware or from cookies
		if (res.locals.user_zip) {
			loc_zip = res.locals.user_zip;
		} else if (req.cookies.stub_user_zipcode) {
			loc_zip = req.cookies.stub_user_zipcode;
		}



		// get top 6 performers
		await knex('stub_top_performers')
			.join('stub_performers', 'stub_top_performers.performer_id', '=', 'stub_performers.performer_id')
			.then(top => top.forEach(performer => {
				if (_.findIndex(top_performers, { 'performer_id': performer.performer_id, slug: performer.performer_slug }) === -1) {
					top_performers.push({
						performer_id: performer.performer_id,
						name: performer.name,
						slug: performer.performer_slug,
						image: performer.featured_image_link
					});
				}
			}))
			.catch(err => logger.error('Error getting featured events under the sports category.', err));



		// get the rest of the other top performers from each parent category
		await knex('stub_sub_top_performers')
			.join('stub_performers', 'stub_sub_top_performers.performer_id', '=', 'stub_performers.performer_id')
			.orderBy('percent')
			.then(top => top.forEach(performer => {
				if (
					// check for duplicates in top performer module
					(_.findIndex(top_performers, { 'performer_id': performer.performer_id, slug: performer.performer_slug }) === -1) &&
					// check if performer already included under nested obj array based on `parent_cat_id`
					(_.findIndex(sub_top_performers[performer.parent_cat_id], { 'performer_id': performer.performer_id, slug: performer.performer_slug }) === -1)
				) {
					sub_top_performers[performer.parent_cat_id].push({
						performer_id: performer.performer_id,
						name: performer.name,
						slug: performer.performer_slug,
						image: performer.featured_image_link
					});
				}
			}))
			.catch(err => logger.error('Error getting featured events under the sports category.', err));



		// get page data
		await knex('stub_pages')
			.where({slug: "home"})
			.limit(1)
			.then(page => page_desc = {title: page[0].desc_title, text: page[0].desc_text})
			.catch(err => logger.error('Error getting the homepage banners.', err));

		// if zipcode && location are set
		if (loc_zip || (location && location.state && location.city) || (location && location.state)) {
			// get county by zipcode
			await knex('stub_zip_county')
				.where({ zipcode: loc_zip })
				.limit(1)
				.then(async res => {
					if (res.length > 0) {
						loc_county = res[0].county;
					} else {

						// get county by city/state
						await knex('stub_zip_county')
							.where({ city: location.city, state: location.state })
							.limit(1)
							.then(async res => {
								if (res.length > 0) {
									loc_county = res[0].county;
								} else {

									// get county at random in state
									await knex('stub_zip_county')
										.where({ state: location.state })
										.limit(1)
										.then(res => {
											loc_county = res[0].county
										})
										.catch(err => logger.error('Error getting a zipcode-county association.', err));
								}
							})
							.catch(err => logger.error('Error getting a zipcode-county association.', err));
					}
				})
				.catch(err => logger.error('Error getting a zipcode-county association.', err));
		}

		await knex('stub_categories')
			.whereRaw('`parent_cat_id` = ? AND `is_featured` = true', [1])
			.then(sports => cat_slider['sports'] = sports)
			.catch(err => logger.error('Error getting featured events under the sports category.', err));

		await knex('stub_categories')
			.whereRaw('`parent_cat_id` = ? AND `is_featured` = true', [2])
			.then(concert => cat_slider['concert'] = concert)
			.catch(err => logger.error('Error getting featured events under the concert category.', err));

		await knex('stub_categories')
			.whereRaw('`parent_cat_id` = ? AND `is_featured` = true', [3])
			.then(theatre => cat_slider['theatre'] = theatre)
			.catch(err => logger.error('Error getting featured events under the theatre category.', err));

		// get the generated local events if the county was generated
		if (location && location.state && loc_county) {

			/* Get cached localized results from Ticket Network */
			const state_events = await knex('stub_zip_events')
				.where({ county: loc_county, state: location.state })
				.limit(1)
				.then(result => result[0])
				.catch(err => {
					logger.error(`Error getting LOCAL events for the concerts category local events in state ${location.state}`, err);
					return { sports: null, concerts: null, theatre: null, other: null };
				});

				console.log(state_events)



			// if the sports category isn't null
			local_events['sports'] = state_events && state_events['sports'] !== null ? JSON.parse(state_events['sports']) : [];
			// if the concerts category isn't null
			local_events['concerts'] = state_events && state_events['concerts'] !== null ? JSON.parse(state_events['concerts']) : [];
			// if the theatre category isn't null
			local_events['theatre'] = state_events && state_events['theatre'] !== null ? JSON.parse(state_events['theatre']) : [];
			// if the other category isn't null
			local_events['other'] = state_events && state_events['sports'] !== null ? JSON.parse(state_events['other']) : [];


			// send response when finished getting local events from ticket network and caching in redis
			res.render('pages/mega-menu', { meta, css, js, home_url, are_results_localized, page_desc, img_slider, cat_slider, local_events, location, top_performers, sub_top_performers, page_name, url: '' });

		} else {
			// if false, hides the `Now Trending` results in the slider as there are no local results
			are_results_localized = false;
			res.render('pages/mega-menu', { meta, css, js, home_url, are_results_localized, page_desc, img_slider, cat_slider, local_events, location, top_performers, sub_top_performers, page_name, url: '' });
		}
	});

}
