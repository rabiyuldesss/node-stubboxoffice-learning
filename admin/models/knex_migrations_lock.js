module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('knex_migrations_lock', {
    'index': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
    'is_locked': {
      type: DataTypes.INTEGER,
    },
  }, {
    tableName: 'knex_migrations_lock',
    underscored: true,
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};

