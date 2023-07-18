
// load all the application enviornment variables
require('dotenv').config({ path: './config/.env' });

module.exports = {
  development: {
    client: 'mysql',
    version: '8.0.12',
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'stubbox',
      charset: 'utf8'
    },
    pool: {
      min: 4,
      max: 16,
      createTimeoutMillis: 3000,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      propagateCreateError: false // <- default is true, set to false
    },
    migrations: {
      directory: __dirname + '/knex/migrations',
    },
  },

  production: {
    client: process.env.KNEX_CONFIG_CLIENT,
    version: process.env.KNEX_CONFIG_DB_VERSION,
    connection: {
      host: process.env.KNEX_CONFIG_HOST,
      user: process.env.KNEX_CONFIG_USER,
      password: process.env.KNEX_CONFIG_PASSWORD,
      database: process.env.KNEX_CONFIG_DATABASE,
      charset: 'utf8'
    },
    pool: {
      min: 4,
      max: 16,
      createTimeoutMillis: 3000,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      propagateCreateError: false // <- default is true, set to false
    },
    migrations: {
      directory: __dirname + '/knex/migrations',
    },
  }
};
