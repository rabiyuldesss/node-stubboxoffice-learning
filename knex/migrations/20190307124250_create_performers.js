
exports.up = function(knex, Promise) {
	// creates stub_performers table
	return knex.schema.createTable('stub_performers', function(table) {
		table.integer('performer_id').primary();
		table.integer('venue_id');
		table.string('name');
		table.text('description').defaultTo(null);
		table.text('banner_img_url').defaultTo(null);
		table.text('performer_img_url').defaultTo(null);
		table.string('performer_slug');
		table.string('parent_cat_slug');
		table.string('child_cat_slug');
		table.string('grandchild_cat_slug');
		table.integer('parent_cat_id');
		table.integer('child_cat_id');
		table.integer('grandchild_cat_id');
		table.string('featured_image_link').defaultTo(null);
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	// drop stub_performers table
	return knex.raw(`DROP TABLE stub_performers`);
};
