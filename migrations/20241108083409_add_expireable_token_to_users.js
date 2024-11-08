/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('users', (table) => {
      table.string('expireable_token').nullable(); // Token for authentication
      table.timestamp('token_expires_at').nullable(); // Token expiration timestamp
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('users', (table) => {
      table.dropColumn('expireable_token');
      table.dropColumn('token_expires_at');
    });
  };
  
