/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    // Drop the 'user' table
    return knex.schema.dropTableIfExists('user');
  };
  
  exports.down = function(knex) {
    // Recreate the 'user' table if needed (optional)
    return knex.schema.createTable('user', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.timestamps(true, true); // Adds created_at and updated_at
    });
  };
  