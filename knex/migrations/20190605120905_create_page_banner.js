
exports.up = function(knex, Promise) {
	// creates stub_page_banners table
	return knex.schema.createTable('stub_page_banners', function(table) {
		table.increments('id');
		table.string('image_url');
		table.string('slug');
		table.boolean('is_page');
		table.boolean('is_master_cat');
		table.boolean('is_child_cat');
		table.boolean('is_grandchild_cat');
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	// drops stub_page_banners table
	return knex.raw(`DROP TABLE stub_page_banners`);
};

