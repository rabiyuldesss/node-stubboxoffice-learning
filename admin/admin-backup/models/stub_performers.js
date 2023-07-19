module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('stub_performers', {
    'performer_id': {
      type: DataTypes.INTEGER,
    },
    'venue_id': {
      type: DataTypes.INTEGER,
    },
    'name': {
      type: DataTypes.STRING,
    },
    'description': {
      type: DataTypes.STRING,
    },
    'banner_img_url': {
      type: DataTypes.STRING,
    },
    'performer_img_url': {
      type: DataTypes.STRING,
    },
    'performer_slug': {
      type: DataTypes.STRING,
    },
    'parent_cat_slug': {
      type: DataTypes.STRING,
    },
    'child_cat_slug': {
      type: DataTypes.STRING,
    },
    'grandchild_cat_slug': {
      type: DataTypes.STRING,
    },
    'parent_cat_id': {
      type: DataTypes.INTEGER,
    },
    'child_cat_id': {
      type: DataTypes.INTEGER,
    },
    'grandchild_cat_id': {
      type: DataTypes.INTEGER,
    },
    'updated_at': {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'stub_performers',
    underscored: true,
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};

