module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('stub_countries', {
    'country_id': {
      type: DataTypes.INTEGER,
    },
    'name': {
      type: DataTypes.STRING,
    },
    'international_phone_code': {
      type: DataTypes.INTEGER,
    },
    'currency_type_description': {
      type: DataTypes.STRING,
    },
    'currency_type_abbreviation': {
      type: DataTypes.STRING,
    },
    'abbreviation': {
      type: DataTypes.STRING,
    },
    'updated_at': {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'stub_countries',
    underscored: true,
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};

