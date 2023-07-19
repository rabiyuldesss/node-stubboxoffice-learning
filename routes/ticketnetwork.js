
// loads environment variables from a .env file
require('dotenv').config({ path: '../../.env' });

// promise based HTTP client
const axios = require('axios');
const soapRequest = require('easy-soap-request');

// API for interacting w/ the file system
const fs = require('fs');

// CSV parser
const csv = require('csv-parser');

// converts XML documents into JSON objects
const x2j = require('rapidx2j');

// Generates a slug from a string
const slug = require('slug');

// utility library
const _ = require('lodash');

// universal logging library
const winston = require('winston');

// configure winston logging
const logConfiguration = {
	'transports': [
		new winston.transports.File({
			filename: './logs/routes/ticketnetwork.log',
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


// application ticket network routes
module.exports = (app, knex) => {

	/***************************************************** Ticket Network: Categories *****************************************************/

	app.get('/tn/get-categories', (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			// get request to ticket network api to get categories
			axios.get(process.env.TICKET_NETWORK_BASE_API_URL + '/GetCategories?websiteConfigID=' + process.env.TICKET_NETWORK_WEBCONFIG_ID)
				.then(response => {
					const json = x2j.parse(response.data, (err, json) => {
						if (err) {
							logger.error("'get-categories' - failed to parse ticket network response into json", err);
							res.send(err);
						} else {
							logger.info("Dropping the 'stub_categories' table.");

						  	knex.schema.dropTableIfExists('stub_categories')
								.then(() => {
									logger.info("Creating the 'stub_categories' table.");

									return knex.schema.createTable('stub_categories', table => {
										table.integer('parent_cat_id');
										table.string('parent_cat_name');
										table.string('parent_cat_slug');
										table.integer('child_cat_id');
										table.string('child_cat_name');
										table.string('child_cat_slug');
										table.integer('grandchild_cat_id').defaultTo(0);
										table.string('grandchild_cat_name').defaultTo(null);
										table.string('grandchild_cat_slug').defaultTo(null);
										table.boolean('is_master_cat');
										table.boolean('is_child_cat');
										table.boolean('is_grandchild_cat');
										table.boolean('is_featured').defaultTo(false);
										table.text('description').defaultTo(null);
										table.string('banner_image_url').defaultTo(null);
										table.string('singles_banner_image_url').defaultTo(null);

										// primary composite key - multiple fields as a key
										table.primary(['parent_cat_id', 'child_cat_id', 'grandchild_cat_id']);
									});
								})
								.then(() => {
									const masterCatArr = [
										{ parent_cat_id: 1, parent_cat_name: 'Sports', parent_cat_slug: 'sports', child_cat_id: 0, child_cat_slug: null, child_cat_name: null, grandchild_cat_id: 0, grandchild_cat_slug: null, grandchild_cat_name: null, description: null, is_master_cat: true, is_child_cat: false, is_grandchild_cat: false },
										{ parent_cat_id: 2, parent_cat_name: 'Concerts', parent_cat_slug: 'concerts', child_cat_id: 0, child_cat_slug: null, child_cat_name: null, grandchild_cat_id: 0, grandchild_cat_slug: null, grandchild_cat_name: null, description: null, is_master_cat: true, is_child_cat: false, is_grandchild_cat: false },
										{ parent_cat_id: 3, parent_cat_name: 'Theatre', parent_cat_slug: 'theatre', child_cat_id: 0, child_cat_slug: null, child_cat_name: null, grandchild_cat_id: 0, grandchild_cat_slug: null, grandchild_cat_name: null, description: null, is_master_cat: true, is_child_cat: false, is_grandchild_cat: false },
										{ parent_cat_id: 4, parent_cat_name: 'Other', parent_cat_slug: 'other', child_cat_id: 0, child_cat_slug: null, child_cat_name: null, grandchild_cat_id: 0, grandchild_cat_slug: null, grandchild_cat_name: null, description: null, is_master_cat: true, is_child_cat: false, is_grandchild_cat: false }
									];

									// insert the top level categories
									masterCatArr.forEach(cat => {
										knex('stub_categories')
											.insert(cat)
											.catch(err => logger.error(`Error while inserting the '${cat.parent_cat_name}' category.`, err));
									});
								})
								.then(() => {
									let childCatArr = [];
									
									// loop through the list of categories we just got back from ticket network
									// get all the parent and child information into one array
									json.category.forEach(cat => childCatArr.push({
										parent_id: cat.parentcategoryid,
										parent_name: cat.parentcategorydescription,
										child_cat_id: cat.childcategoryid,
										child_cat_name: cat.childcategorydescription
									}));

									// to get all the possible child categories
									// _.uniqWith() get the unique items when compared to a fucntion
									// in this case, its _.isEqual() which checks all the objects for duplicate objects
									// then we loop through each unique object
									_.uniqWith(childCatArr, _.isEqual).forEach(cat => {
										knex('stub_categories').insert({
											parent_cat_id: cat.parent_id,
											parent_cat_slug: slug(cat.parent_name, {lower: true}),
											parent_cat_name: cat.parent_name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
											child_cat_id: cat.child_cat_id,
											child_cat_slug: slug(cat.child_cat_name, {lower: true}),
											child_cat_name: cat.child_cat_name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
											is_master_cat: false,
											is_child_cat: true,
											is_grandchild_cat: false
										})
										.catch(err => logger.error(`Error while inserting the '${cat.childcategorydescription}' category.`, err));
									});
								})
								.then(() => {
									let grandCatArr = [];
									
									// loop through the list of categories we just got back from ticket network
									// get all the parent and child information into one array
									json.category.forEach(cat => {
										// if it isnt an empty child category
										if (cat.grandchildcategoryid != 25 && cat.grandchildcategorydescription != '-') {
											grandCatArr.push({
												parent_id: cat.parentcategoryid,
												parent_name: cat.parentcategorydescription,
												child_id: cat.childcategoryid,
												child_name: cat.childcategorydescription,
												grandchild_id: cat.grandchildcategoryid,
												grandchild_name: cat.grandchildcategorydescription,
											});
										}
									});

									// to get all the possible child categories
									// _.uniqWith() get the unique items when compared to a fucntion
									// in this case, its _.isEqual() which checks all the objects for duplicate objects
									// then we loop through each unique object
									_.uniqWith(grandCatArr, _.isEqual).forEach(cat => {
										knex('stub_categories').insert({
											parent_cat_id: cat.parent_id,
											parent_cat_slug: slug(cat.parent_name, {lower: true}),
											parent_cat_name: cat.parent_name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
											child_cat_id: cat.child_id,
											child_cat_slug: slug(cat.child_name, {lower: true}),
											child_cat_name: cat.child_name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
											grandchild_cat_id: cat.grandchild_id,
											grandchild_cat_slug: slug(cat.grandchild_name, {lower: true}),
											grandchild_cat_name: cat.grandchild_name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
											description: null,
											is_master_cat: false,
											is_child_cat: false,
											is_grandchild_cat: true
										})
										.catch(err => logger.error(`Error while inserting the '${cat.grandchildcategorydescription}' category.`, err));
									});
								})
								.then(() => {
									logger.info("Finished importing categories.");
									res.status(200).send({ success: true });
								})
								.catch(err => {
									logger.error("error dropping `stub_categories`", err);
									res.status(200).send({ success: false });
								});
						}	
					});
				})
				.catch(err => {
					logger.error(err);
					res.status(200).send({ success: false });
				});
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});






	/***************************************************** Ticket Network: Countries *****************************************************/

	app.get('/tn/get-countries', (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			axios.get(process.env.TICKET_NETWORK_BASE_API_URL + '/GetCountries?websiteConfigID=' + process.env.TICKET_NETWORK_WEBCONFIG_ID)
				.then(response => {
					const json = x2j.parse(response.data, (err, json) => {
						if (err) {
							logger.error("'get-countries' - failed to parse ticket network response into json", err);
							res.status(200).send({ success: false });
						} else {
							logger.info("Dropping 'stub_countries' table.");

						  	knex.schema.dropTableIfExists('stub_countries')
								.then(() => {
									logger.info("Creating 'stub_countries' table.");

									return knex.schema.createTable('stub_countries', table => {
										table.integer('country_id').primary();
										table.string('name');
										table.integer('international_phone_code');
										table.string('currency_type_description');
										table.string('currency_type_abbreviation');
										table.string('abbreviation');
										table.float('conversion_to_usd');
										table.float('conversion_from_usd');
										table.timestamp('updated_at').defaultTo(knex.fn.now());
									});
								})
								.then(() => {
									logger.info("Starting to import countries.");

									json.country.forEach(country => {
										knex('stub_countries').insert({
											country_id: country.id,
											name: country.name,
											international_phone_code: country.internationalphonecode,
											currency_type_description: country.currencytypedesc,
											currency_type_abbreviation: country.currencytypeabbr,
											abbreviation: country.abbreviation,
											conversion_to_usd: country.conversiontousd,
											conversion_from_usd: country.conversionfromusd
										})
										.catch(err => {
											logger.info("Error when inserting " + country.name);
										});
									});
								})
								.then(() => logger.info("Finished importing countries.\n\n"))
								.catch(err => res.status(200).send({ success: false, err: err }));
						}	
					});
				})
				.then(() => res.status(200).send({ success: true }))
				.catch(err => res.send(err));
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});






	/***************************************************** Ticket Network: States *****************************************************/

	app.get('/tn/get-states', (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			logger.info("Dropping 'stub_states' table.");

			knex.schema.dropTableIfExists('stub_states')
				.then(() => {
					logger.info("Creating 'stub_states' table.");

					return knex.schema.createTable('stub_states', table => {
						table.integer('country_id'); // not from api, have to insert when importing
						table.integer('state_province_id');
						table.string('state_province_short_desc');
						table.string('state_province_long_desc');
						table.string('country_desc');
						table.timestamp('updated_at').defaultTo(knex.fn.now());

						// primary composite key - multiple fields as a key
						table.primary(['country_id', 'state_province_id']);
					});
				})
				.then(() => {
					logger.info("Starting to import states.");

					knex('stub_countries').select('country_id').then(countries => {
						if (countries.length > 0) {
							countries.forEach(country => {
								axios.get(process.env.TICKET_NETWORK_BASE_API_URL + '/GetStates?websiteConfigID=' + process.env.TICKET_NETWORK_WEBCONFIG_ID + '&countryID=' + country.country_id)
									.then(response => {
										x2j.parse(response.data, (err, json) => {
											if (err) {
												logger.error("'get-states' - failed to parse ticket network response into json", err);
											} else {
												if (Array.isArray(json.states)) {
													json.states.forEach(state => {
														knex('stub_states').insert({
															country_id: country.country_id,
															state_province_id: state.stateprovinceid,
															state_province_short_desc: state.stateprovinceshortdesc,
															state_province_long_desc: state.stateprovincelongdesc,
															country_desc: state.countrydesc
														})
														.catch(err => logger.info("Error while inserting multiple states."));
													});
												} else {
													if (json.states === Object(json.states)) {
														knex('stub_states').insert({
															country_id: country.country_id,
															state_province_id: json.states.stateprovinceid,
															state_province_short_desc: json.states.stateprovinceshortdesc,
															state_province_long_desc: json.states.stateprovincelongdesc,
															country_desc: json.states.countrydesc
														})
														.catch(err => logger.info("Error while inserting a single state."));
													}
												}
											}
										});
									})
									.catch(() => res.status(200).send({ success: false, err: err }));
							});
						}
					});
				})
				.then(() => {
					logger.info("Finished importing states.");
					res.status(200).send({ success: true });
				})
				.catch(err => res.send(err));
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});






	/**************************************************** Ticket Network: Cities - Zipcode GetEvents ***************************************************/

	app.get('/tn/init-city-search', async (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			let results = [];

			// open up the `zip_code_database.csv` from 'https://www.unitedstateszipcodes.org/zip-code-database/'
			await fs.createReadStream('./zip_code_database.csv')
				// filter the csv data through csv-parser
				.pipe(csv())
				// pick the data being saved to the database
				.on('data', (data) => {
					// if not `PO Box` or `Unique` && in the United States
					if (data.type==='STANDARD' && data.country==='US' && data.county.length > 0) {
						// push the info to be added to the database into the results array
						results.push({
							city: data.primary_city,
							state: data.state,
							zipcode: pad_zipcode(data.zip)
						});
					}
				})
				// once we have the information, add it to the database
				.on('end', async () => {
					// loop through each location object in the array
					for (let position in results) {
						// insert the location object info in results with the `pos` position
						await knex('stub_city')
							.insert(results[position])
							.catch(err => logger.error(`Error while inserting the '${results[position].zipcode}' zipcode data.`, err));
					}

					res.status(200).send({ success: true, status: "ERR" });
				});
			
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});






	/***************************************************** Ticket Network: Performers *****************************************************/

	app.get('/tn/get-performers', async (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			// set SOAP request headers
			const tnurl = process.env.TICKET_NETWORK_BASE_API_URL;
			const header = {
				'Host': process.env.TICKET_NETWORK_HOST_URL,
				'Content-Type': 'text/xml; charset=utf-8',
				'SOAPAction': process.env.TICKET_NETWORK_SOAP_ACTION_BASE + "/GetPerformerByCategory"
			};
			const xml = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetPerformerByCategory xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>24798</websiteConfigID></GetPerformerByCategory></soap:Body></soap:Envelope>';

			// destruct the response
			const { response } = await soapRequest(tnurl, header, xml, 10000); // Optional timeout parameter(milliseconds)

			// turn the xml in the reponse to usable json
			const json = x2j.parse(response.body, (err, json) => {
				if (err) {
					logger.error("'get-performers' - failed to parse ticket network response into json", err);
					res.status(200).send({ success: false });
				} else {
					logger.info("Dropping the 'stub_performers' table.");

				  	knex.schema.dropTableIfExists('stub_performers')
						.then(() => {
							logger.info("Creating 'stub_performers' table.");

							return knex.schema.createTable('stub_performers', table => {
								table.integer('performer_id').primary();
								table.integer('venue_id');
								table.string('name');
								table.text('description').defaultTo(null);
								table.text('banner_img_url').defaultTo(null);
								table.text('performer_img_url').defaultTo(null);
								table.string('performer_slug');
								table.string('parent_cat_slug');
								table.string('child_cat_slug');
								table.string('grandchild_cat_slug');
								table.integer('parent_cat_id');
								table.integer('child_cat_id');
								table.integer('grandchild_cat_id');
								table.string('featured_image_link').defaultTo(null);
								table.timestamp('updated_at').defaultTo(knex.fn.now());
							});
						})
						.then(() => {
							logger.info("Starting to import perfomers.");

							json['soap:body'].getperformerbycategoryresponse.getperformerbycategoryresult.performer.forEach(performer => {
								knex('stub_performers').insert({
									performer_id: performer.id,
									venue_id: performer.homevenueid,
									name: performer.description,
									performer_slug: slug(performer.description, {lower: true}),
									parent_cat_id: performer.category.parentcategoryid,
									child_cat_id: performer.category.childcategoryid,
									grandchild_cat_id: performer.category.grandchildcategoryid,
									parent_cat_slug: slug(performer.category.parentcategorydescription, {lower: true}),
									child_cat_slug: slug(performer.category.childcategorydescription, {lower: true}),
									grandchild_cat_slug: performer.category.grandchildcategorydescription === '-' ? null : slug(performer.category.grandchildcategorydescription, {lower: true})
								})
								.catch(err => {
									logger.info("Error when inserting " + performer.description);
									logger.info(err);
								});
							});
						})
						.then(() => logger.info("Finished importing performers."))
						.then(() => res.status(200).send({ success: true }))
						.catch(err => res.status(200).send({ success: false, err: err }) );
				}	
			});
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});






	/***************************************************** Ticket Network: Update Performers *****************************************************/

	app.get('/tn/update-performers', async (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {

			// For Ticket Network SOAP Requests
			const tnurl = process.env.TICKET_NETWORK_BASE_API_URL;
			
			const headers = {
				'Host': process.env.TICKET_NETWORK_HOST_URL,
				'Content-Type': 'text/xml; charset=utf-8',
				'SOAPAction': process.env.TICKET_NETWORK_SOAP_ACTION_BASE + "/GetPerformerByCategory"
			};

			const performer_count_start = await knex('stub_performers')
				.count('id as COUNT')
				.then(rows => rows[0].COUNT);

			logger.info("Starting `update-performers` function with " + performer_count_start + " performers");

			// get every category
			await knex('stub_categories')
				.then(async cats => {
					if (cats.length > 0) {
						for (const num in cats) {
							// Ticket Newtork XML data
							let xml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetPerformerByCategory xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>${process.env.TICKET_NETWORK_WEBCONFIG_ID}</websiteConfigID><parentCategoryID>${cats[num].parent_cat_id}</parentCategoryID>`;

							if (cats[num].child_cat_id !== 0) { xml += `<childCategoryID>${cats[num].child_cat_id}</childCategoryID>`; }
							if (cats[num].grandchild_cat_id !== 0) { xml += `<grandchildCategoryID>${cats[num].grandchild_cat_id}</grandchildCategoryID>` }

							xml += '</GetPerformerByCategory></soap:Body></soap:Envelope>';

							// Send the Ticket Network SOAP request with axios
							await axios.post(tnurl, xml, { headers: headers })
								.then(async response => {
									if (response.data.substring(0, 5) === '<?xml') {
										// should NOT insert by default
										let should_insert = false;
										// parse the Ticket Network XML response
										const json = x2j.parse(response.data);

										// determine if the information should be inserted, check for undefined
										if (typeof(json['soap:body'].getperformerbycategoryresponse) !== undefined) {
											if ((typeof(json['soap:body'].getperformerbycategoryresponse.getperformerbycategoryresult) !== undefined) && (typeof(json['soap:body'].getperformerbycategoryresponse.getperformerbycategoryresult) !== true)) {
												if (typeof(json['soap:body'].getperformerbycategoryresponse.getperformerbycategoryresult.performer) !== undefined) {
													should_insert = true;
												}
											}
										}

										if (should_insert) {
											const json_info = json['soap:body'].getperformerbycategoryresponse.getperformerbycategoryresult.performer;

											// w/ lodash, determine if it's type array, then grab the needed info
											if (_.isArray(json_info) && json_info.length > 0) {
												json_info.forEach(async performer => {
													await knex('stub_performers')
														.where({
															performer_id: performer.id,
															parent_cat_id: performer.category.parentcategoryid,
															child_cat_id: performer.category.childcategoryid,
															grandchild_cat_id: performer.category.grandchildcategoryid
														})
														.then(async res => {
															if (res.length < 1) { // if not stored/found

																await knex('stub_performers').insert({
																	performer_id: performer.id,
																	venue_id: performer.homevenueid,
																	name: performer.description,
																	performer_slug: slug(performer.description, {lower: true}),
																	parent_cat_id: performer.category.parentcategoryid,
																	child_cat_id: performer.category.childcategoryid,
																	grandchild_cat_id: performer.category.grandchildcategoryid,
																	parent_cat_slug: slug(performer.category.parentcategorydescription, {lower: true}),
																	child_cat_slug: slug(performer.category.childcategorydescription, {lower: true}),
																	grandchild_cat_slug: performer.category.grandchildcategorydescription === '-' ? null : slug(performer.category.grandchildcategorydescription, {lower: true})
																})
																.catch(err => logger.info("Error when inserting " + performer.description, err));
															}
														})
														.catch(err => logger.info("Error when selecting in database: " + performer.description, err));
												});
											
											// w/ lodash, determine if an Object && add the single event as/into the array
											} else if (_.isPlainObject(json_info)) {
												await knex('stub_performers')
														.where({
															performer_id: json_info.id,
															parent_cat_id: json_info.category.parentcategoryid,
															child_cat_id: json_info.category.childcategoryid,
															grandchild_cat_id: json_info.category.grandchildcategoryid
														})
														.then(async res => {
															if (res.length < 1) { // if not stored/found
																await knex('stub_performers')
																	.insert({
																		performer_id: json_info.id,
																		venue_id: json_info.homevenueid,
																		name: json_info.description,
																		performer_slug: slug(json_info.description, {lower: true}),
																		parent_cat_id: json_info.category.parentcategoryid,
																		child_cat_id: json_info.category.childcategoryid,
																		grandchild_cat_id: json_info.category.grandchildcategoryid,
																		parent_cat_slug: slug(json_info.category.parentcategorydescription, {lower: true}),
																		child_cat_slug: slug(json_info.category.childcategorydescription, {lower: true}),
																		grandchild_cat_slug: json_info.category.grandchildcategorydescription === '-' ? null : slug(performer.category.grandchildcategorydescription, {lower: true})
																	})
																	.catch(err => logger.info("Error when inserting " + performer.description, err));
															}
														})
														.catch(err => logger.info("Error when selecting in database: " + performer.description, err));
											}
										}
									} else {
										logger.info(`TICKET NETWORK ERROR: couldn't get high_sales_performers for parent:${cat.parent_cat_id}, child:${cat.child_cat_id}, grandchild:${cat.grandchild_cat_id}`);
									}
								})
								.catch(err => {
									logger.error(`Error on axios request for performer category ${cats[num].parent_cat_id}-${cats[num].parent_cat_slug}/${cats[num].child_cat_id}-${cats[num].child_cat_slug}/${cats[num].grandchild_cat_id}-${cats[num].grandchild_cat_slug}`, err);
									return null;
								});
						}
					}
				})
				.then(() => res.status(200).send({ success: true }))
				.catch(err => {
					logger.error(`Error retrieving categories from database for getting high sales performers. `, err);
					res.status(401).json({ success: false, status: "ERR", message: "error dropping high_sales table" });			
				});

			const performer_count_end = await knex('stub_performers')
				.count('id as COUNT')
				.then(rows => rows[0].COUNT);

			logger.info("Ending `update-performers` function with " + performer_count_end + " performers. " + (performer_count_end - performer_count_start) + " new performer(s).");

		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});






	/***************************************************** Ticket Network: Venues *****************************************************/

	app.get('/tn/get-venues', async (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			// get the information using SOAP
			const tnurl = process.env.TICKET_NETWORK_BASE_API_URL;
			const header = {
				'Host': process.env.TICKET_NETWORK_HOST_URL,
				'Content-Type': 'text/xml; charset=utf-8',
				'SOAPAction': process.env.TICKET_NETWORK_SOAP_ACTION_BASE + "/GetVenue"
			};
			const xml = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetVenue xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>' + process.env.TICKET_NETWORK_WEBCONFIG_ID + '</websiteConfigID></GetVenue></soap:Body></soap:Envelope>';

			// destruct the response
			const { response } = await soapRequest(tnurl, header, xml, 30000); // Optional timeout parameter(milliseconds)

			// turn the xml in the reponse to usable json
			const json = x2j.parse(response.body, (err, json) => {
				if (err) {
					logger.error("'get-venues' - failed to parse ticket network response into json", err);
					res.status(200).send({ success: false });
				} else {
					logger.info("Dropping 'stub_venues' table.");

					knex.schema.dropTableIfExists('stub_venues')
						.then(() => {
							logger.info("Creating 'stub_venues' table.");

							return knex.schema.createTable('stub_venues', table => {
								table.integer('venue_id').primary();
								table.string('venue_name');
								table.text('description').defaultTo(null);
								table.text('banner_img_url').defaultTo(null);
								table.text('venue_img_url').defaultTo(null);
								table.string('venue_slug');
								table.bigInteger('capacity');
								table.string('box_office_phone');
								table.integer('configurations');
								table.text('url', 'mediumtext');
								table.string('street_1');
								table.string('street_2');
								table.string('city');
								table.string('state_province');
								table.string('country');
								table.string('zipcode');
								table.string('directions');
								table.string('public_transport');
								table.string('parking');
								table.boolean('will_call');
								table.string('rules');
								table.string('child_rules');
								table.string('notes');
								table.timestamp('updated_at').defaultTo(knex.fn.now());
							});
						})
						.then(() => {
							logger.info("Starting to import venues.");

							json['soap:body'].getvenueresponse.getvenueresult.venue.forEach(venue => {
								knex('stub_venues').insert({
									venue_id: venue.id,
									venue_name: venue.name,
									venue_slug: slug(venue.name, {lower: true}),
									description: null,
									banner_img_url: null,
									venue_img_url: null,
									capacity: venue.capacity,
									box_office_phone: isNaN(venue.boxofficephone) ? venue.boxofficephone : venue.boxofficephone.toString(),
									configurations: venue.numberofconfigurations,
									url: venue.url,
									street_1: venue.street1,
									street_2: venue.street2,
									city: venue.city,
									state_province: venue.stateprovince,
									country: venue.country,
									zipcode: venue.zipcode,
									directions: venue.directions,
									public_transport: venue.publictransportation,
									parking: venue.parking,
									will_call: venue.willcall,
									rules: venue.rules,
									child_rules: venue.childrules,
									notes: venue.notes
								})
								.catch(err => {
									logger.info("Error when inserting " + venue.name);
									logger.info(err);
								});
							});
						})
						.then(() => {
							logger.info("Finished importing venues.");
							res.status(200).send({ success: true });
						})
						.catch(err => {
							logger.info("Error dropping table `stub_venues`.");
							logger.info(err);
						});
				}
			})
			.catch(err => res.send(err));
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});






	/***************************************************** Ticket Network: High Inventory Performers *****************************************************/

	app.get('/tn/get-high-sales-performers', async (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			logger.info("starting `get-high-sales-performers` function.");

			// For Ticket Network SOAP Requests
			const tnurl = process.env.TICKET_NETWORK_BASE_API_URL;
			
			const headers = {
				'Host': process.env.TICKET_NETWORK_HOST_URL,
				'Content-Type': 'text/xml; charset=utf-8',
				'SOAPAction': process.env.TICKET_NETWORK_SOAP_ACTION_BASE + "/GetHighSalesPerformers"
			};

			await knex.schema.dropTableIfExists('stub_high_sales_performers')
				.then(async () => {
					logger.info("Creating 'stub_high_sales_performers' table.");

					return await knex.schema.createTable('stub_high_sales_performers', table => {
						table.integer('performer_id').primary();
						table.string('name');
						table.string('performer_slug');
						table.float('percent');
						table.integer('parent_cat_id');
						table.integer('child_cat_id').defaultTo(25);
						table.integer('grandchild_cat_id').defaultTo(25);
						table.timestamp('updated_at').defaultTo(knex.fn.now());
					});
				})
				.then(async cats => {
					// get every category
					await knex('stub_categories')
						.then(async cats => {
							if (cats.length > 0) {
								for (const num in cats) {
									let xml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetHighSalesPerformers xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>${process.env.TICKET_NETWORK_WEBCONFIG_ID}</websiteConfigID><numReturned>20</numReturned><parentCategoryID>${cats[num].parent_cat_id}</parentCategoryID>`;
									xml += cats[num].child_cat_id === 0 ? "" : `<childCategoryID>${cats[num].child_cat_id}</childCategoryID>`;
									xml += cats[num].grandchild_cat_id === 0 ? "" : `<grandchildCategoryID>${cats[num].grandchild_cat_id}</grandchildCategoryID>`;
									xml += `</GetHighSalesPerformers></soap:Body></soap:Envelope>`;

									// send request for the current category's
									await requestHighSalesPerformers(cats[num], tnurl, headers, xml);
								}
							}
						})
						.then(() => res.status(200).send({ success: true }))
						.catch(err => {
							logger.error(`Error retrieving categories from database for getting high sales performers. `, err);
							res.status(401).json({ success: false, status: "ERR", message: "error dropping high_sales table" });			
						});
				})

			logger.info("Ending `get-high-sales-performers` function.");
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});

	async function requestHighSalesPerformers(cat, tnurl, headers, xml) {
		// Send the Ticket Network SOAP request with axios
		await axios.post(tnurl, xml, { headers: headers })
			.then(async response => {
				if (response.data.substring(0, 5) === '<?xml') {
					// should NOT insert by default
					let should_insert = false;
					// parse the Ticket Network XML response
					const json = x2j.parse(response.data);

					// determine if the information should be inserted, check for undefined
					if (typeof(json['soap:body'].gethighsalesperformersresponse) !== undefined) {
						if ((typeof(json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult) !== undefined) && (typeof(json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult) !== true)) {
							if (typeof(json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult.performerpercent) !== undefined) {
								should_insert = true;
							}
						}
					}

					if (should_insert) {
						const json_info = json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult.performerpercent;

						// w/ lodash, determine if it's type array, then grab the needed info
						if (_.isArray(json_info) && json_info.length > 0) {
							json_info.forEach(async high_performer => {
								// get the count of the performer w/ the given id and slug
								const perfomerCount = await knex('stub_performers')
									.where({
										performer_id: high_performer.id,
										performer_slug: slug(high_performer.description, {lower: true}),
									})
									.count('id as COUNT')
									.then(rows => rows[0].COUNT);

								// if there is at least one performer found
								if (perfomerCount >= 1) {
									knex('stub_high_sales_performers').insert({
										performer_id: high_performer.id,
										name: high_performer.description,
										performer_slug: slug(high_performer.description, {lower: true}),
										percent: high_performer.percent,
										parent_cat_id: high_performer.category.parentcategoryid,
										child_cat_id: high_performer.category.childcategoryid,
										grandchild_cat_id: high_performer.category.grandchildcategoryid
									})
									.catch(err => logger.info("Error while inserting multiple high inventory performers", err));
								}
							});
						
						// w/ lodash, determine if an Object && add the single event as/into the array
						} else if (_.isPlainObject(json_info)) {
							// get the count of the performer w/ the given id and slug
							const perfomerCount = await knex('stub_performers')
									.where({
										performer_id: json_info.id,
										performer_slug: slug(json_info.description, {lower: true}),
									})
									.count('id as COUNT')
									.then(rows => rows[0].COUNT);

							// if there is at least one performer found
							if (perfomerCount >= 1) {
								knex('stub_high_sales_performers').insert({
									performer_id: json_info.id,
									name: json_info.description,
									performer_slug: slug(json_info.description, {lower: true}),
									percent: json_info.percent,
									parent_cat_id: json_info.category.parentcategoryid,
									child_cat_id: json_info.category.childcategoryid,
									grandchild_cat_id: json_info.category.grandchildcategoryid
								})
								.catch(err => logger.info("Error while inserting a single high inventory performer", err));
							}
						}
					}
				} else {
					logger.info(`TICKET NETWORK ERROR: couldn't get high_sales_performers for parent:${cat.parent_cat_id}, child:${cat.child_cat_id}, grandchild:${cat.grandchild_cat_id}`);
				}
			})
			.catch(err => {
				logger.error(`Error sending axios high_sales request to Ticket Network`, err);
				return null;
			});
	}






	/**************************************************** Ticket Network: Zipcode GetEvents ***************************************************/

	app.get('/tn/init-zip-events', async (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			let results = [];

			// open up the `zip_code_database.csv` from 'https://www.unitedstateszipcodes.org/zip-code-database/'
			await fs.createReadStream('./zip_code_database.csv')
				// filter the csv data through csv-parser
				.pipe(csv())
				// pick the data being saved to the database
				.on('data', (data) => {
					// if not `PO Box` or `Unique` && in the United States
					if (data.type==='STANDARD' && data.country==='US' && data.county.length > 0) {
						// try and find the index of the location we want to insert in `results` array
						// if _.findIndex() returns -1 then it's not in the `results` array
						if (_.findIndex(results, (obj) => obj.county === data.county && obj.state === data.state) === -1) {
							// push the info to be added to the database into the results array
							results.push({
								zipcode: pad_zipcode(data.zip),
								city: data.primary_city,
								county: data.county,
								state: data.state
							});
						}
					}
				})
				// once we have the information, add it to the database
				.on('end', async () => {
					// loop through each location object in the array
					for (let position in results) {
						// insert the location object info in results with the `pos` position
						await knex('stub_zip_events')
							.insert(results[position])
							.catch(err => logger.error(`Error while inserting the '${results[position].zipcode}' zipcode data.`, err));
					}

					res.status(200).send({ success: true, status: "ERR" });
				});
			
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});

	// pads the zipcode so there are at least 5 numbers in the string
	function pad_zipcode(zip) {
		while (zip.length < 5) { zip = '0' + zip; }
		return zip;
	}






	/**************************************************** Ticket Network: Zipcode GetEvents ***************************************************/

	app.get('/tn/get-zip-events', async (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			// sets how many requests to concurrently send at a time to Ticket Network
			const batch_num = 15;

			// acts as trigger to break the outer for loop early
			let break_zip_loop = false;

			// For Ticket Network SOAP Requests
			const tnurl = process.env.TICKET_NETWORK_BASE_API_URL;

			const headers = {
				'Host': process.env.TICKET_NETWORK_HOST_URL,
				'Content-Type': 'text/xml; charset=utf-8',
				'SOAPAction': process.env.TICKET_NETWORK_SOAP_ACTION_BASE + "/GetEvents"
			};

			logger.info("Start of get-zip-events.");

			// select all the zipcode, state, and county info
			await knex('stub_zip_events').select('zipcode', 'state', 'county').whereRaw(`state='TX' OR state='NJ'`).then(async zipcodes => {
				// Loop over all the zipcodes, batch by `batch_num` zipcodes
				for (let pos = 0; pos < zipcodes.length; pos += batch_num) {
					// stop the loop short and set remainder to true if there are no more zipcodes
					if (break_zip_loop) break;

					// holds the zipcodes to query Ticket Network for local events
					let zipArr = [];

					// loop through the current batch
					for (let inner = 0; inner < batch_num; inner++) {
						// if the zip info exists
						if (zipcodes[pos+inner]) {
							// push the zip info into the zipArr
							zipArr.push(zipcodes[pos+inner]);

						// if there are no more zip info objects
						} else {
							// break the outer for loop to stop adding zips into zipArr
							break_zip_loop = true;
							// break this inner for loop
							break;
						}
					}

					// concurrently get 
					await concurrentGetBatchZip(tnurl, headers, zipArr);
				}
			})
			.then(() => res.status(200).send({ success: true }))
			.catch(err => res.send(err));

			logger.info("End of get-zip-events.");
			
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});


	// use concurrency to batch get request the different given local events to Ticket Network
	async function concurrentGetBatchZip(tnurl, headers, data) {
		try {
			// concurrently send all
			const tn_res = await axios.all(data.map(zip => concurrentGetLocalEvents(zip, tnurl, headers)));

			tn_res.forEach(location => {

				// update the corresponding row
				knex('stub_zip_events')
					//with the given zipcode
					.where({ zipcode: location['zip'] })
					// update the values corresponding to those in local_events
					// as keys in `local_events` && columns in `stub_zip_events` table have the same names
					.update({ sports: location['sports'], concerts: location['concerts'], theatre: location['theatre'], other: location['other'] })
					.catch(err => logger.error(`Error while inserting event data for the '${location['zip']}' data.`, err));
			});
		}
		catch(err) {
			logger.error(`Error while inserting event data for the '${location['zip']}' data.`, err);
		}

		return null;
	}


	// use concurrency to batch the 4 parent category requests for events to Ticket Network
	function concurrentGetLocalEvents(zip, tnurl, headers) {
		// concurrently get Ticket Network local events
		return axios.all([
			getCategoryEventsByZip(zip, tnurl, headers, `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEvents xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>${process.env.TICKET_NETWORK_WEBCONFIG_ID}</websiteConfigID><numberOfEvents>4</numberOfEvents><nearZip>${zip.zipcode}</nearZip><parentCategoryID>1</parentCategoryID><orderByClause>Date</orderByClause></GetEvents></soap:Body></soap:Envelope>`),
			getCategoryEventsByZip(zip, tnurl, headers, `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEvents xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>${process.env.TICKET_NETWORK_WEBCONFIG_ID}</websiteConfigID><numberOfEvents>4</numberOfEvents><nearZip>${zip.zipcode}</nearZip><parentCategoryID>2</parentCategoryID><orderByClause>Date</orderByClause></GetEvents></soap:Body></soap:Envelope>`),
			getCategoryEventsByZip(zip, tnurl, headers, `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEvents xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>${process.env.TICKET_NETWORK_WEBCONFIG_ID}</websiteConfigID><numberOfEvents>4</numberOfEvents><nearZip>${zip.zipcode}</nearZip><parentCategoryID>3</parentCategoryID><orderByClause>Date</orderByClause></GetEvents></soap:Body></soap:Envelope>`),
			getCategoryEventsByZip(zip, tnurl, headers, `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetEvents xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>${process.env.TICKET_NETWORK_WEBCONFIG_ID}</websiteConfigID><numberOfEvents>4</numberOfEvents><nearZip>${zip.zipcode}</nearZip><parentCategoryID>4</parentCategoryID><orderByClause>Date</orderByClause></GetEvents></soap:Body></soap:Envelope>`)
		])
		.then(axios.spread(async (tn_sports, tn_concerts, tn_theatre, tn_other) => ({ zip: zip.zipcode, sports: tn_sports, concerts: tn_concerts, theatre: tn_theatre, other: tn_other })));
	}


	function getCategoryEventsByZip(zip, tnurl, headers, xml) {
		// Send the given category Ticket Network SOAP request with axios
		return axios.post(tnurl, xml, { headers: headers }).then(async response => {
			// parse the Ticket Network XML response
			const json = x2j.parse(response.data);

			// determine if the information should be inserted, && check for undefined at all levels
			if (json['soap:body']) {
				if (json['soap:body'].geteventsresponse) {
					if ((json['soap:body'].geteventsresponse.geteventsresult) && (typeof(json['soap:body'].geteventsresponse.geteventsresult) !== true)) {
						if (json['soap:body'].geteventsresponse.geteventsresult.event) {
							// to make the following easier to read
							const events = json['soap:body'].geteventsresponse.geteventsresult.event;

							// w/ lodash, determine if it's type array, then grab the needed info
							if (_.isArray(events)) {
								// map && create new arr of event id/name objects && then stringify it to json string
								return JSON.stringify(events.map(obj => { return { "id": obj.id, "name": obj.name }; }));
							
							// w/ lodash, determine if an Object && add the single event as/into the array
							} else if (_.isPlainObject(events)) {
								// build object array && then stringify it to json string
								return JSON.stringify([{ "id": events.id, "name": events.name }]);
							}
						}
					}
				}
			}	

			// return empty
			return null;
		})
		.catch(err => {
			logger.error(`Error getting LOCAL events for '${zip.zipcode}' zipcode in '${zip.county}, ${zip.state}'.---`, err);
			return null;
		});
	}





	/**************************************************** Ticket Network: Zipcode GetEvents ***************************************************/

	app.get('/tn/init-zip-county-assoc', async (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			let results = [];

			logger.info("Start of init-zip-county-assoc.");
			
			// open up the `zip_code_database.csv` from 'https://www.unitedstateszipcodes.org/zip-code-database/'
			await fs.createReadStream('./zip_code_database.csv')
				// filter the csv data through csv-parser
				.pipe(csv())
				// pick the data being saved to the database
				.on('data', (data) => {
					// push into `results` array if type NOT (`PO Box` or `Unique`) && country IS (United States)
					if (data.type==='STANDARD' && data.country==='US' && data.county.length > 0) results.push({ zipcode: pad_zipcode(data.zip), city: data.primary_city, county: data.county, state: data.state });
				})
				// once we have the information, add it to the database
				.on('end', async () => {
					// loop through each location object in the array
					for (let position in results) {
						// insert the location object info in results with the `pos` position
						await knex('stub_zip_county')
							.insert(results[position])
							.catch(err => logger.error(`Error while inserting the '${results[position].zipcode}' zipcode - county association data.`, err));
					}

					res.status(200).send({ success: true, status: "success" });
				});

			logger.info("End of init-zip-county-assoc.");
			
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});





	/***************************************************** Ticket Network: Top Performers *****************************************************/

	app.get('/tn/get-top-performers', async (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			logger.info("starting `get-top-performers` function.");

			// For Ticket Network SOAP Requests
			const tnurl = process.env.TICKET_NETWORK_BASE_API_URL;
			
			const headers = {
				'Host': process.env.TICKET_NETWORK_HOST_URL,
				'Content-Type': 'text/xml; charset=utf-8',
				'SOAPAction': process.env.TICKET_NETWORK_SOAP_ACTION_BASE + "/GetHighSalesPerformers"
			};

			await knex.schema.dropTableIfExists('stub_top_performers')
				.then(async () => {
					logger.info("Creating 'stub_top_performers' table.");

					return await knex.schema.createTable('stub_top_performers', table => {
						table.integer('performer_id').primary();
						table.string('name');
						table.string('performer_slug');
						table.float('percent');
						table.integer('parent_cat_id');
						table.integer('child_cat_id').defaultTo(25);
						table.integer('grandchild_cat_id').defaultTo(25);
						table.timestamp('updated_at').defaultTo(knex.fn.now());
					});
				})
				.then(async () => {
					// for each parent category
					[1,2,3].forEach(async (cat_num, idx) => {
						const xml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetHighSalesPerformers xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>${process.env.TICKET_NETWORK_WEBCONFIG_ID}</websiteConfigID><numReturned>2</numReturned><parentCategoryID>${cat_num}</parentCategoryID></GetHighSalesPerformers></soap:Body></soap:Envelope>`;

						// Send the Ticket Network SOAP request with axios
						await axios.post(tnurl, xml, { headers: headers })
							.then(async response => {
								if (response.data.substring(0, 5) === '<?xml') {
									// should NOT insert by default
									let should_insert = false;
									// parse the Ticket Network XML response
									const json = x2j.parse(response.data);

									// determine if the information should be inserted, check for undefined
									if (typeof(json['soap:body'].gethighsalesperformersresponse) !== undefined) {
										if ((typeof(json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult) !== undefined) && (typeof(json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult) !== true)) {
											if (typeof(json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult.performerpercent) !== undefined) {
												should_insert = true;
											}
										}
									}

									if (should_insert) {
										const json_info = json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult.performerpercent;
										let insertArr = [];

										// w/ lodash, determine if it's type array, then grab the needed info
										if (_.isArray(json_info) && json_info.length > 0) {
											json_info.forEach(high_performer => {
												insertArr.push({
													performer_id: high_performer.id,
													name: high_performer.description,
													performer_slug: slug(high_performer.description, {lower: true}),
													percent: high_performer.percent,
													parent_cat_id: high_performer.category.parentcategoryid,
													child_cat_id: high_performer.category.childcategoryid,
													grandchild_cat_id: high_performer.category.grandchildcategoryid
												});
											});

											_.uniqBy(insertArr, 'performer_id').forEach(high_performer => {
												knex('stub_top_performers')
													.insert(high_performer)
													.catch(err => logger.info("Error while inserting multiple high inventory performers", err));
											});
										
										// w/ lodash, determine if an Object && add the single event as/into the array
										} else if (_.isPlainObject(json_info)) {
											knex('stub_top_performers').insert({
												performer_id: json_info.id,
												name: json_info.description,
												performer_slug: slug(json_info.description, {lower: true}),
												percent: json_info.percent,
												parent_cat_id: json_info.category.parentcategoryid,
												child_cat_id: json_info.category.childcategoryid,
												grandchild_cat_id: json_info.category.grandchildcategoryid
											})
											.catch(err => logger.info("Error while inserting a single high inventory performer", err));
										}
									}
								} else {
									logger.info(`TICKET NETWORK ERROR: couldn't get high_sales_performers for parent:${cat.parent_cat_id}, child:${cat.child_cat_id}, grandchild:${cat.grandchild_cat_id}`);
								}
							})
							.catch(err => {
								logger.error(`Error sending axios high_sales request to Ticket Network`, err);
								return null;
							});
					});
				})

			logger.info("Ending `get-top-performers` function.");
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});





	/***************************************************** Ticket Network: Sub Top Performers *****************************************************/

	app.get('/tn/get-sub-top-performers', async (req, res) => {
		if (req.query.c === process.env.TICKET_NETWORK_UPDATE_CODE) {
			logger.info("starting `get-sub-top-performers` function.");

			// For Ticket Network SOAP Requests
			const tnurl = process.env.TICKET_NETWORK_BASE_API_URL;
			
			const headers = {
				'Host': process.env.TICKET_NETWORK_HOST_URL,
				'Content-Type': 'text/xml; charset=utf-8',
				'SOAPAction': process.env.TICKET_NETWORK_SOAP_ACTION_BASE + "/GetHighSalesPerformers"
			};

			await knex.schema.dropTableIfExists('stub_sub_top_performers')
				.then(async () => {
					logger.info("Creating 'stub_sub_top_performers' table.");

					return await knex.schema.createTable('stub_sub_top_performers', table => {
						table.integer('performer_id').primary();
						table.string('name');
						table.string('performer_slug');
						table.float('percent');
						table.integer('parent_cat_id');
						table.integer('child_cat_id').defaultTo(25);
						table.integer('grandchild_cat_id').defaultTo(25);
						table.timestamp('updated_at').defaultTo(knex.fn.now());
					});
				})
				.then(async () => {
					// for each parent category
					[1,2,3,4].forEach(async (cat_num, idx) => {
						const xml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetHighSalesPerformers xmlns="http://tnwebservices.ticketnetwork.com/tnwebservice/v3.2"><websiteConfigID>${process.env.TICKET_NETWORK_WEBCONFIG_ID}</websiteConfigID><numReturned>10</numReturned><parentCategoryID>${cat_num}</parentCategoryID></GetHighSalesPerformers></soap:Body></soap:Envelope>`;

						// Send the Ticket Network SOAP request with axios
						await axios.post(tnurl, xml, { headers: headers })
							.then(async response => {
								if (response.data.substring(0, 5) === '<?xml') {
									// should NOT insert by default
									let should_insert = false;
									// parse the Ticket Network XML response
									const json = x2j.parse(response.data);

									// determine if the information should be inserted, check for undefined
									if (typeof(json['soap:body'].gethighsalesperformersresponse) !== undefined) {
										if ((typeof(json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult) !== undefined) && (typeof(json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult) !== true)) {
											if (typeof(json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult.performerpercent) !== undefined) {
												should_insert = true;
											}
										}
									}

									if (should_insert) {
										const json_info = json['soap:body'].gethighsalesperformersresponse.gethighsalesperformersresult.performerpercent;
										let insertArr = [];

										// w/ lodash, determine if it's type array, then grab the needed info
										if (_.isArray(json_info) && json_info.length > 0) {
											json_info.forEach(high_performer => {
												insertArr.push({
													performer_id: high_performer.id,
													name: high_performer.description,
													performer_slug: slug(high_performer.description, {lower: true}),
													percent: high_performer.percent,
													parent_cat_id: high_performer.category.parentcategoryid,
													child_cat_id: high_performer.category.childcategoryid,
													grandchild_cat_id: high_performer.category.grandchildcategoryid
												});
											});

											_.uniqBy(insertArr, 'performer_id').forEach(high_performer => {
												knex('stub_sub_top_performers')
													.insert(high_performer)
													.catch(err => logger.info("Error while inserting multiple high inventory performers", err));
											});
										
										// w/ lodash, determine if an Object && add the single event as/into the array
										} else if (_.isPlainObject(json_info)) {
											knex('stub_sub_top_performers').insert({
												performer_id: json_info.id,
												name: json_info.description,
												performer_slug: slug(json_info.description, {lower: true}),
												percent: json_info.percent,
												parent_cat_id: json_info.category.parentcategoryid,
												child_cat_id: json_info.category.childcategoryid,
												grandchild_cat_id: json_info.category.grandchildcategoryid
											})
											.catch(err => logger.info("Error while inserting a single high inventory performer", err));
										}
									}
								} else {
									logger.info(`TICKET NETWORK ERROR: couldn't get high_sales_performers for parent:${cat.parent_cat_id}, child:${cat.child_cat_id}, grandchild:${cat.grandchild_cat_id}`);
								}
							})
							.catch(err => {
								logger.error(`Error sending axios high_sales request to Ticket Network`, err);
								return null;
							});
					});
				})

			logger.info("Ending `get-top-performers` function.");
		} else {
			res.status(401).json({ success: false, status: "ERR", message: "code is missing or not valid" });
		}
	});
}