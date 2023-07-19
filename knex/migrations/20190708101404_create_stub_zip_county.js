
exports.up = function(knex, Promise) {
	// creates stub_local_events table
	return knex.schema.createTable('stub_zip_county', table => {
		table.string('zipcode').primary();
		table.string('city');
		table.string('county');
		table.string('state');
	});
};

exports.down = function(knex, Promise) {
	// drops stub_local_events table
	return knex.raw(`DROP TABLE stub_zip_county`);
};
