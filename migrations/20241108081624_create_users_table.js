/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('last_name').notNullable();
        table.string('gender').notNullable();
        table.date('birth_date').notNullable();
        table.string('current_adress').notNullable();
        table.string('phone').notNullable();
        table.string('income').notNullable();
        table.string('state').notNullable();
        table.string('email').unique().notNullable();
        table.enu('role', ['admin', 'customer']).notNullable().defaultTo('customer'); // Add role column
        table.enu('user_type', ['inwoners', 'wonningzoekende']).notNullable().defaultTo('inwoners'); // Add user_type column
        table.timestamps(true, true); // created_at and updated_at
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('users');
};
