// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'mysql2', // Use mysql2 for MySQL/MariaDB
    connection: {
      host: '127.0.0.1', // Localhost
      user: 'root',      // Default user for XAMPP
      password: '',      // Empty password for XAMPP by default
      database: 'comfortliving', // Replace with your database name
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};
