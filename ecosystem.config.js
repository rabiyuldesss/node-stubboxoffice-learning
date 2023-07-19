
module.exports = {
  apps : [{
    name: 'Stub Boxoffice',
    script: 'app.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: '',
    instances: 3,
    autorestart: true,
    watch: true,
    ignore_watch : ["config", "knex", "logs", "node_modules"],
    max_memory_restart: '1G',
  }],
};
