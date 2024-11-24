/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
    exports.up = function(knex) {
        return knex.schema.createTable('user_houses', (table) => {
            table.increments('id').primary(); // Auto-incrementing primary key
            table.integer('user_id').unsigned().notNullable(); // Foreign key to 'users' table
            table.integer('house_id').unsigned().notNullable(); // Foreign key to 'houses' table
            table.timestamp('created_at').defaultTo(knex.fn.now()); // Creation timestamp
            table.timestamp('updated_at').defaultTo(knex.fn.now()); // Update timestamp

            // Add foreign key constraints
            table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.foreign('house_id').references('id').inTable('houses').onDelete('CASCADE');
        });
    };

    /**
     * @param { import("knex").Knex } knex
     * @returns { Promise<void> }
     */
    exports.down = function(knex) {
        return knex.schema.dropTable('user_houses'); // Drop the table during rollback
    };
