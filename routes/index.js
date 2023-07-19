
/*
 * import all routes from files and pass objects to routes:
 * app ----- express application
 * knex ---- mysql db orm connection
 * redis --- redis store connection
 */


module.exports = (app, knex) => {

	// general page routes (home/contact/etc.)
	require('./general')(app, knex);

	// legal page routes
	require('./legal')(app);

	// site ajax routes
	require('./ajax')(app, knex)

	// performer page routes
	require('./performer')(app, knex);

	// category page routes
	require('./category')(app, knex);

	// ticketnetwork api routes
	require('./ticketnetwork')(app, knex);

	// client & server error routes
	require('./errors')(app);

}
