
exports.up = function(knex, Promise) {
	// creates high_inventory_performers table
	return knex.schema.createTable('stub_high_inventory_performers', function(table) {
		table.increments('id');
		table.integer('performer_id');
		table.string('performer_name');
		table.integer('parent_cat_id');
		table.integer('child_cat_id');
		table.integer('grandchild_cat_id');
		table.float('percent');
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	// creates high_inventory_performers table
	return knex.raw(`DROP TABLE stub_high_inventory_performers`);
};
