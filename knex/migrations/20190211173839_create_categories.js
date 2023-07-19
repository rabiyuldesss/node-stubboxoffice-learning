
exports.up = function(knex, Promise) {
	// creates categories table
	return knex.schema.createTable('stub_categories', function(table) {
		table.integer('parent_cat_id');
		table.string('parent_cat_name');
		table.string('parent_cat_slug');
		table.integer('child_cat_id');
		table.string('child_cat_name');
		table.string('child_cat_slug');
		table.integer('grandchild_cat_id').defaultTo(0);
		table.string('grandchild_cat_name').defaultTo(null);
		table.string('grandchild_cat_slug').defaultTo(null);
		table.boolean('is_master_cat');
		table.boolean('is_child_cat');
		table.boolean('is_grandchild_cat');
		table.boolean('is_featured').defaultTo(false);
		table.text('description').defaultTo(null);
		table.string('banner_image_url').defaultTo(null);
		table.string('singles_banner_image_url').defaultTo(null);
		
		// primary composite key - multiple fields as a key
		table.primary(['parent_cat_id', 'child_cat_id', 'grandchild_cat_id']);
	});
};

exports.down = function(knex, Promise) {
	// drop categories table
	return knex.raw(`DROP TABLE stub_categories`);
};
