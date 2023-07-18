
exports.up = function(knex, Promise) {
	// drops stub_local_events table
	return knex.raw(`DROP TABLE stub_city`);
};

exports.down = function(knex, Promise) {
	// creates stub_local_events table
	return knex.schema.createTable('stub_city', table => {
		table.string('city').primary();
		table.string('state');
		table.string('zipcode');
	});
};
