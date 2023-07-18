
exports.up = function(knex, Promise) {
	// creates stub_top_performers table
	return knex.schema.createTable('stub_top_performers', table => {
		table.integer('performer_id').primary();
		table.string('name');
		table.string('performer_slug');
		table.float('percent');
		table.integer('parent_cat_id');
		table.integer('child_cat_id').defaultTo(25);
		table.integer('grandchild_cat_id').defaultTo(25);
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	// drops stub_top_performers table
	return knex.raw(`DROP TABLE stub_top_performers`);
};
