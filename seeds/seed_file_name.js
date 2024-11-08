/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const bcrypt = require('bcryptjs');

exports.seed = function(knex) {
    // Delete all existing entries
    return knex('users')
        .del()
        .then(function () {
            // Hash passwords for new users
            const password = bcrypt.hashSync('1234', 10);  // Hash the password
      

            // Insert seed entries with role and user_type
            return knex('users').insert([
                { 
                    name: 'user1', 
                    email: 'user1@example.com',
                    password: password, 
                    role: 'admin', // Assign role 'admin'
                    user_type: 'inwoners', // Assign user_type 'inwoners'
                },
                { 
                    name: 'user2', 
                    email: 'user2@example.com',
                    password: password, 
                    role: 'customer', // Assign role 'customer'
                    user_type: 'wonningzoekende', // Assign user_type 'wonningzoekende'
                },
                { 
                    name: 'user3', 
                    email: 'user3@example.com',
                    password: bcrypt.hashSync('password789', 10), 
                    role: 'customer', 
                    user_type: 'inwoners', 
                }
            ]);
        });
};