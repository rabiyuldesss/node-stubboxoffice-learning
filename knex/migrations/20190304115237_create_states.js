
exports.up = function(knex, Promise) {
	// creates states table
	return knex.schema.createTable('stub_states', function(table) {
		table.integer('country_id'); // not from api, have to insert when importing
		table.integer('state_province_id');
		table.string('state_province_short_desc');
		table.string('state_province_long_desc');
		table.string('country_desc');
		table.timestamp('updated_at').defaultTo(knex.fn.now());

		// primary composite key - multiple fields as a key
		table.primary(['country_id', 'state_province_id']);
	});
};

exports.down = function(knex, Promise) {
	// drop states table
	return knex.raw(`DROP TABLE stub_states`);
};
