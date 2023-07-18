
exports.up = function(knex, Promise) {
	// creates event performers table
	return knex.schema.createTable('stub_event_performers', function(table) {
		table.increments('id');
		table.integer('event_id');
		table.integer('performer_id');
		table.string('performer_name');
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	// drop event performers table
	return knex.raw(`DROP TABLE stub_event_performers`);
};