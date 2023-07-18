module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('stub_states', {
    'country_id': {
      type: DataTypes.INTEGER,
    },
    'state_province_id': {
      type: DataTypes.INTEGER,
    },
    'state_province_short_desc': {
      type: DataTypes.STRING,
    },
    'state_province_long_desc': {
      type: DataTypes.STRING,
    },
    'country_desc': {
      type: DataTypes.STRING,
    },
    'updated_at': {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'stub_states',
    underscored: true,
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};

