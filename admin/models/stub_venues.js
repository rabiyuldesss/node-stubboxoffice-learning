module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('stub_venues', {
    'venue_id': {
      type: DataTypes.INTEGER,
    },
    'venue_name': {
      type: DataTypes.STRING,
    },
    'description': {
      type: DataTypes.STRING,
    },
    'banner_img_url': {
      type: DataTypes.STRING,
    },
    'venue_img_url': {
      type: DataTypes.STRING,
    },
    'venue_slug': {
      type: DataTypes.STRING,
    },
    'capacity': {
      type: DataTypes.INTEGER,
    },
    'box_office_phone': {
      type: DataTypes.STRING,
    },
    'configurations': {
      type: DataTypes.INTEGER,
    },
    'url': {
      type: DataTypes.STRING,
    },
    'street_1': {
      type: DataTypes.STRING,
    },
    'street_2': {
      type: DataTypes.STRING,
    },
    'city': {
      type: DataTypes.STRING,
    },
    'state_province': {
      type: DataTypes.STRING,
    },
    'country': {
      type: DataTypes.STRING,
    },
    'zipcode': {
      type: DataTypes.STRING,
    },
    'directions': {
      type: DataTypes.STRING,
    },
    'public_transport': {
      type: DataTypes.STRING,
    },
    'parking': {
      type: DataTypes.STRING,
    },
    'will_call': {
      type: DataTypes.BOOLEAN,
    },
    'rules': {
      type: DataTypes.STRING,
    },
    'child_rules': {
      type: DataTypes.STRING,
    },
    'notes': {
      type: DataTypes.STRING,
    },
    'updated_at': {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'stub_venues',
    underscored: true,
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};

