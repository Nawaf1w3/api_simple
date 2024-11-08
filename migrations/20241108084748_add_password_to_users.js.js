/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
module.exports = {
    up: function (knex) {
        return knex.schema.table('users', function (table) {
            table.string('password').notNullable();  // Add password column
        });
    },

    down: function (knex) {
        return knex.schema.table('users', function (table) {
            table.dropColumn('password');  // Remove password column if rollback
        });
    }
};