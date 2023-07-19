
// loads environment variables from a .env file
require('dotenv').config({ path: '../../.env' });

// utility library
const _ = require('lodash');

// universal logging library
const winston = require('winston');

// configure winston logging
const logConfiguration = {
	'transports': [
		new winston.transports.File({
			filename: './logs/routes/category.log',
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

	/***************************************************** Top Level Category Page *****************************************************/

	app.get("/events/:parent_cat_slug", async (req, res, next) => {
		let performers = [];
		let top_sellers = [];
		let top_cats = [];
		// let top_events = [];
		let default_header_img = home_url + "/public/img/header/";
		const category_page_title = req.params.parent_cat_slug.charAt(0).toUpperCase() + req.params.parent_cat_slug.slice(1);

		switch (req.params.parent_cat_slug) {
			case 'sports':
				default_header_img = default_header_img + 'header-img-sports.jpg';
				break;
			case 'concerts':
				default_header_img = default_header_img + 'header-img-concerts.jpg';
				break;
			case 'theatre':
				default_header_img = default_header_img + 'header-img-theatre.jpg';
				break;
			case 'other':
				default_header_img = default_header_img + 'header-img-other.jpg';
				break;
			default:
				default_header_img = default_header_img + 'header-img-sports.jpg';
		}

		// next() inside of nested async function leads to error:
		// `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
		if (res.headersSent) {
			return;
		}


		// get current category info
		const cat_info = await knex('stub_categories')
			.where({ parent_cat_slug: req.params.parent_cat_slug, is_master_cat: true, is_child_cat: false, is_grandchild_cat: false })
			.then(async cats => {
				cat = JSON.parse(JSON.stringify(cats))[0];

				// get performers
				await knex('stub_high_sales_performers')
					.where({ parent_cat_id: cat.parent_cat_id })
					.orderBy('percent', 'desc')
					.limit(20)
					.offset(5)
					.then(performs => {
						if (performs !== undefined && performs.length !== 0) {
							performers = performs;
						} else {
							return next(); // should lead to 404
						}
					})
					.catch(err => next(new Error('Having trouble getting performers.'))); // should lead to 500

				return cat;
			})
			.catch(err => logger.error(err));


		// get "Top Selling {{ category }}" list
		await knex('stub_sub_top_performers')
			.where({ parent_cat_id: cat_info.parent_cat_id })
			.orderBy('percent', 'desc')
			.limit(6)
			.then(top_performs => top_performs.forEach(obj => top_sellers.push({...obj})))
			.catch(err => logger.error(err));

		// get "Top {{ category }} Categories" list
		// get performers
		const top_cat_performers = await knex('stub_high_sales_performers')
			.whereRaw('parent_cat_id = ? order by percent desc limit 20', [cat.parent_cat_id])
			.then(performs => {
				if (performs === undefined && performs.length === 0) {
					return next(); // should lead to 404
				}
				return performs;
			})
			.catch(err => next(new Error('Having trouble getting performers.'))); // should lead to 500

		const top_cat_ids = _.uniq(top_cat_performers.map(obj => obj.child_cat_id));
		// CANNOT USE .forEach | Reason: cause javascript fucking sucks sometimes
		// loop through each sub category
		for (const id of top_cat_ids) {
			// get sub categories results and add to existing category
			await knex('stub_categories')
				.where({ child_cat_id: id, is_master_cat: false, is_child_cat: true, is_grandchild_cat: false })
				.then(cat => top_cats.push({...cat[0]}))
				.catch(err => logger.error(err));
		}

		// get performers
		const top_events = await knex('stub_high_sales_performers')
			.where({ parent_cat_id: cat.parent_cat_id })
			.orderBy('percent', 'desc')
			.limit(12)
			.offset(26)
			.catch(err => next(new Error('Having trouble getting performers.'))); // should lead to 500

		const css = [ home_url + "/public/css/main.css", home_url + "/public/css/category.css" ];
		let meta = { page_title: category_page_title + " | Stub Boxoffice" };
		const js = [];


		if (req.params.parent_cat_slug === 'sports') {
			let main_cats = {};
			// get current category info
			main_cats['mlb'] = await knex('stub_categories').where({ grandchild_cat_slug: "professional-mlb", is_grandchild_cat: true }).then(cats => JSON.parse(JSON.stringify(cats))[0]);
			main_cats['nba'] = await knex('stub_categories').where({ grandchild_cat_slug: "professional-nba", is_grandchild_cat: true }).then(cats => JSON.parse(JSON.stringify(cats))[0]);
			main_cats['nfl'] = await knex('stub_categories').where({ grandchild_cat_slug: "nfl", is_grandchild_cat: true }).then(cats => JSON.parse(JSON.stringify(cats))[0]);
			main_cats['nhl'] = await knex('stub_categories').where({ grandchild_cat_slug: "professional-nhl", is_grandchild_cat: true }).then(cats => JSON.parse(JSON.stringify(cats))[0]);

			res.render('pages/category-sports', { meta, css, js, home_url, default_header_img, performers, category_page_title, cat_info, top_sellers, top_cats, top_events, main_cats, url: req.originalUrl});
		} else {
			res.render('pages/category-default', { meta, css, js, home_url, default_header_img, performers, category_page_title, cat_info, top_sellers, top_cats, top_events, url: req.originalUrl});
		}
	});

	/***************************************************** Child Category Page *****************************************************/

	app.get("/events/:parent_cat_slug/:child_cat_slug", async (req, res, next) => {
		let categories = [];
		let performers = [];
		const category_page_title = req.params.child_cat_slug.charAt(0).toUpperCase() + req.params.child_cat_slug.slice(1);

		let default_header_img = home_url + "/public/img/header/";

		switch (req.params.parent_cat_slug) {
			case 'sports':
				default_header_img = default_header_img + 'header-img-sports.jpg';
				break;
			case 'concerts':
				default_header_img = default_header_img + 'header-img-concerts.jpg';
				break;
			case 'theatre':
				default_header_img = default_header_img + 'header-img-theatre.jpg';
				break;
			case 'other':
				default_header_img = default_header_img + 'header-img-other.jpg';
				break;
			default:
				default_header_img = default_header_img + 'header-img-sports.jpg';
		}

		// next() inside of nested async function leads to error:
		// `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
		if (res.headersSent) {
			return;
		}

		// get current category info
		const cat_info = await knex('stub_categories')
			.where({ child_cat_slug: req.params.child_cat_slug, is_master_cat: false, is_child_cat: true, is_grandchild_cat: false })
			.then(async cats => {
				cat = JSON.parse(JSON.stringify(cats))[0];

				// get performers
				await knex('stub_high_sales_performers')
					.whereRaw('child_cat_id = ? order by percent desc limit 16', [cat.child_cat_id])
					.then(performs => {
						if (performs !== undefined && performs.length !== 0) {
							performers = performs;
						}
					})
					.catch(async err => {
						logger.error(`Error getting high sales performers for the ${req.params.child_cat_slug} category`, err);
					}); // should lead to 500

				if (performers.length === 0 || performers === undefined) {
					// get performers
					await knex('stub_performers')
						.whereRaw('child_cat_id = ? order by RAND() asc limit 16', [cat.child_cat_id])
						.then(performs => {
							if (performs !== undefined && performs.length !== 0) {
								performers = performs;
							} else {
								return next(); // should lead to 404
							}
						})
						.catch(err => next(new Error('Having trouble getting performers.'))); // should lead to 500
				}

				return cat;
			})
			.catch(err => logger.error(err));

		// get categories
		await knex('stub_categories')
			.where({
				parent_cat_slug: req.params.parent_cat_slug,
				child_cat_slug: req.params.child_cat_slug,
				is_grandchild_cat: true
			})
			.then(cats => categories = JSON.parse(JSON.stringify(cats)))
			.catch(err => logger.error(err));

		const css = [ home_url + "/public/css/main.css", home_url + "/public/css/category.css" ];
		let meta = { page_title: category_page_title + " | Stub Boxoffice" };
		const js = [];

		res.render('pages/category-child', { meta, css, js, home_url, default_header_img, categories, performers, category_page_title, cat_info, parent_cat_slug: req.params.parent_cat_slug, child_cat_slug: req.params.child_cat_slug, url: req.originalUrl });
	});

	/***************************************************** MLB, NHL, NFL, NBA Category Pages *****************************************************/

	app.get("/events/sports/baseball/professional-mlb", async (req, res, next) => {
		let performers = [];
		let category = {};

		// get performers
		await knex('stub_performers')
			.where({
				parent_cat_slug: "sports",
				child_cat_slug: "baseball",
				grandchild_cat_slug: "professional-mlb"
			})
			.then(performs => {
				if (performs !== undefined && performs.length !== 0) {
					performers = JSON.parse(JSON.stringify(performs));
				} else {
					return next(); // should lead to 404
				}
			})
			.catch(err => next(new Error('Having trouble getting MLB teams.'))); // should lead to 500

		// next() inside of nested async function leads to error:
		// `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
		if (res.headersSent) {
			return;
		}

		// get current category info
		const cat_info = await knex('stub_categories')
			.where({ grandchild_cat_slug: 'professional-mlb', is_master_cat: false, is_child_cat: false, is_grandchild_cat: true })
			.then(cats => JSON.parse(JSON.stringify(cats))[0])
			.catch(err => logger.error(err));

		// get category information
		await knex('stub_categories')
			.where({
				parent_cat_slug: "sports",
				child_cat_slug: "baseball",
				grandchild_cat_slug: "professional-mlb"
			})
			.limit(1)
			.then(cat => category = JSON.parse(JSON.stringify(cat[0])))
			.catch(err => logger.error(err));

		const css = [ home_url + "/public/css/main.css", home_url + "/public/css/category.css" ];
		let meta = { page_title: "MLB | Stub Boxoffice" };
		const js = [];

		res.render('pages/category-grandchild-sports', { meta, css, js, home_url, default_header_img: home_url + "/public/img/header/header-img-sports.jpg", performers, category, cat_info, cat_name: 'MLB' , url: req.originalUrl});
	});

	app.get("/events/sports/basketball/professional-nba", async (req, res, next) => {
		let performers = [];
		let category = {};

		// get performers
		await knex('stub_performers')
			.where({
				parent_cat_slug: "sports",
				child_cat_slug: "basketball",
				grandchild_cat_slug: "professional-nba"
			})
			.then(performs => {
				if (performs !== undefined && performs.length !== 0) {
					performers = JSON.parse(JSON.stringify(performs));
				} else {
					return next(); // should lead to 404
				}
			})
			.catch(err => next(new Error('Having trouble getting NBA teams.'))); // should lead to 500

		// next() inside of nested async function leads to error:
		// `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
		if (res.headersSent) {
			return;
		}

		// get current category info
		const cat_info = await knex('stub_categories')
			.where({ grandchild_cat_slug: 'professional-nba', is_master_cat: false, is_child_cat: false, is_grandchild_cat: true })
			.then(cats => JSON.parse(JSON.stringify(cats))[0])
			.catch(err => logger.error(err));

		// get category information
		await knex('stub_categories')
			.where({
				parent_cat_slug: "sports",
				child_cat_slug: "basketball",
				grandchild_cat_slug: "professional-nba"
			})
			.limit(1)
			.then(cat => category = JSON.parse(JSON.stringify(cat[0])))
			.catch(err => logger.error(err));

		const css = [ home_url + "/public/css/main.css", home_url + "/public/css/category.css" ];
		let meta = { page_title: "NBA | Stub Boxoffice" };
		const js = [];

		res.render('pages/category-grandchild-sports', { meta, css, js, home_url, default_header_img: home_url + "/public/img/header/header-img-sports.jpg", performers, category, cat_info, cat_name: 'NBA' , url: req.originalUrl});
	});

	app.get("/events/sports/football/nfl/", async (req, res, next) => {
		let performers = [];
		let category = {};

		// get performers
		await knex('stub_performers')
			.where({
				parent_cat_slug: "sports",
				child_cat_slug: "football",
				grandchild_cat_slug: "nfl"
			})
			.then(performs => {
				if (performs !== undefined && performs.length !== 0) {
					performers = JSON.parse(JSON.stringify(performs));
				} else {
					return next(); // should lead to 404
				}
			})
			.catch(err => next(new Error('Having trouble getting NFL teams.'))); // should lead to 500

		// next() inside of nested async function leads to error:
		// `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
		if (res.headersSent) {
			return;
		}

		// get current category info
		const cat_info = await knex('stub_categories')
			.where({ grandchild_cat_slug: 'nfl', is_master_cat: false, is_child_cat: false, is_grandchild_cat: true })
			.then(cats => JSON.parse(JSON.stringify(cats))[0])
			.catch(err => logger.error(err));

		// get category information
		await knex('stub_categories')
			.where({
				parent_cat_slug: "sports",
				child_cat_slug: "football",
				grandchild_cat_slug: "nfl"
			})
			.limit(1)
			.then(cat => category = JSON.parse(JSON.stringify(cat[0])))
			.catch(err => logger.error(err));

		const css = [ home_url + "/public/css/main.css", home_url + "/public/css/category.css" ];
		let meta = { page_title: "NFL | Stub Boxoffice" };
		const js = [];

		res.render('pages/category-grandchild-sports', { meta, css, js, home_url, default_header_img: home_url + "/public/img/header/header-img-sports.jpg", performers, category, cat_info, cat_name: 'NFL', url: req.originalUrl });
	});

	app.get("/events/sports/hockey/professional-nhl/", async (req, res, next) => {
		let performers = [];
		let category = {};

		// get performers
		await knex('stub_performers')
			.where({
				parent_cat_slug: "sports",
				child_cat_slug: "hockey",
				grandchild_cat_slug: "professional-nhl"
			})
			.then(performs => {
				if (performs !== undefined && performs.length !== 0) {
					performers = JSON.parse(JSON.stringify(performs));
				} else {
					return next(); // should lead to 404
				}
			})
			.catch(err => next(new Error('Having trouble getting NFL teams.'))); // should lead to 500

		// next() inside of nested async function leads to error:
		// `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
		if (res.headersSent) {
			return;
		}

		// get current category info
		const cat_info = await knex('stub_categories')
			.where({ grandchild_cat_slug: 'professional-nhl', is_master_cat: false, is_child_cat: false, is_grandchild_cat: true })
			.then(cats => JSON.parse(JSON.stringify(cats))[0])
			.catch(err => logger.error(err));

		// get category information
		await knex('stub_categories')
			.where({
				parent_cat_slug: "sports",
				child_cat_slug: "hockey",
				grandchild_cat_slug: "professional-nhl"
			})
			.limit(1)
			.then(cat => category = JSON.parse(JSON.stringify(cat[0])))
			.catch(err => logger.error(err));

		const css = [ home_url + "/public/css/main.css", home_url + "/public/css/category.css" ];
		let meta = { page_title: "NHL | Stub Boxoffice" };
		const js = [];

		res.render('pages/category-grandchild-sports', { meta, css, js, home_url, default_header_img: home_url + "/public/img/header/header-img-sports.jpg", performers, category, cat_info, cat_name: 'NHL', url: req.originalUrl });
	});

	/***************************************************** Grandchild Category Page *****************************************************/

	app.get("/events/:parent_cat_slug/:child_cat_slug/:grandchild_cat_slug", async (req, res, next) => {
		let performers = [];
		let category = {};

		let default_header_img = home_url + "/public/img/header/";

		switch (req.params.parent_cat_slug) {
			case 'sports':
				default_header_img = default_header_img + 'header-img-sports.jpg';
				break;
			case 'concerts':
				default_header_img = default_header_img + 'header-img-concerts.jpg';
				break;
			case 'theatre':
				default_header_img = default_header_img + 'header-img-theatre.jpg';
				break;
			case 'other':
				default_header_img = default_header_img + 'header-img-other.jpg';
				break;
			default:
				default_header_img = default_header_img + 'header-img-sports.jpg';
		}

		// get performers
		await knex('stub_performers')
			.whereRaw('grandchild_cat_slug = ? order by RAND() asc limit 50', [req.params.grandchild_cat_slug])
			.then(performs => {
				if (performs !== undefined && performs.length !== 0) {
					performers = JSON.parse(JSON.stringify(performs));
				} else {
					return next() // should lead to 404
				}
			})
			.catch(err => next(new Error('Having trouble getting performers.'))); // should lead to 500

		// next() inside of nested async function leads to error:
		// `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
		if (res.headersSent) {
			return;
		}

		// get current category info
		const cat_info = await knex('stub_categories')
			.where({ grandchild_cat_slug: req.params.grandchild_cat_slug, is_master_cat: false, is_child_cat: false, is_grandchild_cat: true })
			.then(cats => JSON.parse(JSON.stringify(cats))[0])
			.catch(err => logger.error(err));

		// get category information
		await knex('stub_categories')
			.where({
				parent_cat_slug: req.params.parent_cat_slug,
				child_cat_slug: req.params.child_cat_slug,
				grandchild_cat_slug: req.params.grandchild_cat_slug
			})
			.limit(1)
			.then(cat => category = JSON.parse(JSON.stringify(cat[0])))
			.catch(err => logger.error(err));

		const css = [ home_url + "/public/css/main.css", home_url + "/public/css/category.css" ];
		let meta = { page_title: category.grandchild_cat_name + " | Stub Boxoffice" };
		const js = [];

		res.render('pages/category-grandchild', { meta, css, js, home_url, default_header_img: home_url + "/public/img/header/header-img-sports.jpg", performers, category, cat_info, url: req.originalUrl });
	});

}
