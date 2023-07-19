
exports.up = function(knex, Promise) {
	// creates stub_local_events table
	return knex.schema.createTable('stub_city', table => {
		table.string('city');
		table.string('state');
		table.string('zipcode');
		// primary composite key - multiple fields as a key
		table.primary(['city', 'state']);
	});
};

exports.down = function(knex, Promise) {
	// drops stub_local_events table
	return knex.raw(`DROP TABLE stub_city`);
};
