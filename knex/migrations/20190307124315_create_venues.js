
exports.up = function(knex, Promise) {
	// creates venues table
	return knex.schema.createTable('stub_venues', function(table) {
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
};

exports.down = function(knex, Promise) {
	// drop venues table
	return knex.raw(`DROP TABLE stub_venues`);
};
