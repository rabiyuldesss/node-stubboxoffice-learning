
exports.up = function(knex, Promise) {
	// creates categories table
	return knex.schema.table('stub_categories', function(table) {
		table.string('banner_image_url');
	});
};

exports.down = function(knex, Promise) {
	// creates categories table
	return knex.schema.table('stub_categories', function(table) {
		table.dropColumn('banner_image_url');
	});
};
