
exports.up = function(knex, Promise) {
	// creates events table
	return knex.schema.createTable('stub_events', function(table) {
		table.increments('id');
		table.integer('parent_category_id');
		table.integer('child_category_id');
		table.integer('grandchild_category_id');
		table.string('name');
		table.string('city');
		table.string('state');
		table.integer('state_id');
		table.integer('country_id');
		table.dateTime('date');
		table.string('display_date');
		table.string('map_url');
		table.integer('venue_id');
		table.integer('venue_config_id');
		table.string('venue_name');
		table.integer('is_womens');
		table.integer('event_id');
		table.integer('clicks');
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	// drop events table
	return knex.raw(`DROP TABLE stub_events`);
};
