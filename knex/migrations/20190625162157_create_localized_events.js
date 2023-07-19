
exports.up = function(knex, Promise) {
	// creates stub_local_events table
	return knex.schema.createTable('stub_local_events', table => {
		table.increments('id');
		table.string('state_abbrv');
		table.text('sports').defaultTo(null);
		table.text('concerts').defaultTo(null);
		table.text('theatre').defaultTo(null);
		table.text('other').defaultTo(null);
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	// drops stub_local_events table
	return knex.raw(`DROP TABLE stub_local_events`);
};

