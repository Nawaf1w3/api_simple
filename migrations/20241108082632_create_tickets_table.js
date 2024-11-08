/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('tickets', (table) => {
      table.increments('id').primary(); // Auto-incrementing primary key
      table.integer('user_id').unsigned().notNullable(); // Foreign key to users table
      table.enu('type', ['repair', 'quotation']).notNullable(); // Enum column for type
      table.timestamps(true, true); // created_at and updated_at columns
  
      // Define foreign key constraint
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('tickets');
  };
  