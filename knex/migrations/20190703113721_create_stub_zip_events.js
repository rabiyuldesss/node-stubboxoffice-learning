
exports.up = function(knex, Promise) {
	// creates stub_local_events table
	return knex.schema.createTable('stub_zip_events', table => {
		table.string('zipcode').primary();
		table.string('city');
		table.string('county');
		table.string('state');
		table.text('sports').defaultTo(null);
		table.text('concerts').defaultTo(null);
		table.text('theatre').defaultTo(null);
		table.text('other').defaultTo(null);
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	// drops stub_local_events table
	return knex.raw(`DROP TABLE stub_zip_events`);
};

