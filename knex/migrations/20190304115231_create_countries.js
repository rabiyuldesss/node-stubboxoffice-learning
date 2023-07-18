
exports.up = function(knex, Promise) {
	// creates countries table
	return knex.schema.createTable('stub_countries', function(table) {
		table.integer('country_id').primary();
		table.string('name');
		table.integer('international_phone_code');
		table.string('currency_type_description');
		table.string('currency_type_abbreviation');
		table.string('abbreviation');
		table.float('conversion_to_usd');
		table.float('conversion_from_usd');
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	// drop countries table
	return knex.raw(`DROP TABLE stub_countries`);
};
