/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('houses', (table) => {
      table.increments('id').primary(); // Auto-incrementing primary key
      table.string('name').notNullable(); // Name of the house
      table.string('address').notNullable(); // Address of the house
      table.timestamps(true, true); // created_at and updated_at columns
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('houses');
  };
  
  