
exports.up = function(knex, Promise) {
	// drops stub_high_sales_performers table
	return knex.raw(`DROP TABLE stub_high_sales_performers`);
};

exports.down = function(knex, Promise) {
	// creates stub_high_sales_performers table
	return knex.schema.createTable('stub_high_sales_performers', table => {
		table.increments('id');
		table.integer('performer_id');
		table.string('name');
		table.string('performer_slug');
		table.float('percent');
		table.integer('parent_cat_id');
		table.integer('child_cat_id').defaultTo(25);
		table.integer('grandchild_cat_id').defaultTo(25);
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};
