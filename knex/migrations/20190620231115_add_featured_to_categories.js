
exports.up = function(knex, Promise) {
	// creates categories table
	return knex.schema.table('stub_categories', function(table) {
		table.boolean('is_featured').defaultTo(false);
	});
};

exports.down = function(knex, Promise) {
	// creates categories table
	return knex.schema.table('stub_categories', function(table) {
		table.dropColumn('is_featured');
	});
};
