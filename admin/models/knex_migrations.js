module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('knex_migrations', {
    'name': {
      type: DataTypes.STRING,
    },
    'batch': {
      type: DataTypes.INTEGER,
    },
    'migration_time': {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'knex_migrations',
    underscored: true,
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};

