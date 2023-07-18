
exports.up = function(knex, Promise) {
	// creates page banners table
	return knex.schema.table('stub_page_banners', function(table) {
		table.string('image_link').defaultTo(null);
	});
};

exports.down = function(knex, Promise) {
	// drop the image_link column
	return knex.schema.table('stub_page_banners', function(table) {
		table.dropColumn('image_link');
	});
};
