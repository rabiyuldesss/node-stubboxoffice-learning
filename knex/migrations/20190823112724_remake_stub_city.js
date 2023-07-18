
exports.up = function(knex, Promise) {
	// creates stub_local_events table
	return knex.schema.createTable('stub_city', table => {
		table.increments('id');
		table.string('city');
		table.string('state');
		table.string('zipcode');
	});
};

exports.down = function(knex, Promise) {
	// drops stub_local_events table
	return knex.raw(`DROP TABLE stub_city`);
};
