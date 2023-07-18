
exports.up = function(knex, Promise) {
	// adds featured_image_link to stub_performers table
	return knex.schema.table('stub_performers', function(table) {
		table.string('featured_image_link').defaultTo(null);
	});
};

exports.down = function(knex, Promise) {
	// drop the featured_image_link column
	return knex.schema.table('stub_performers', function(table) {
		table.dropColumn('featured_image_link');
	});
};
