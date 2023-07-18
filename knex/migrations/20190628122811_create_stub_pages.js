
exports.up = function(knex, Promise) {
	// creates stub_high_sales_performers table
	return knex.schema.createTable('stub_pages', table => {
		table.increments('id');
		table.string('name');
		table.string('slug');
		table.text('desc_title');
		table.text('desc_text');
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	// drops stub_high_sales_performers table
	return knex.raw(`DROP TABLE stub_pages`);
};
