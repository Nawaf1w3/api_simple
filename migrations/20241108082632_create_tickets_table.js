/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('tickets', (table) => {
      table.increments('id').primary(); // Auto-incrementing primary key
      table.integer('user_id').unsigned().notNullable(); // Foreign key to users table
      table.enu('type', ['repair', 'quotation']).notNullable(); // Enum column for type
      table.string('title').notNullable(); // Title of the ticket
      // table.text('long_text'); // Long descriptive text
      table.text('problem_details'); // Details of the problem
      table.integer('house_id').unsigned().nullable(); // Foreign key to houses table (optional)

      table.timestamps(true, true); // created_at and updated_at columns

      // Define foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('house_id').references('id').inTable('houses').onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tickets');
};
