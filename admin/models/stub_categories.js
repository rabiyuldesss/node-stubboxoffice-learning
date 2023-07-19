module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('stub_categories', {
    'parent_cat_id': {
      type: DataTypes.INTEGER,
    },
    'parent_cat_name': {
      type: DataTypes.STRING,
    },
    'parent_cat_slug': {
      type: DataTypes.STRING,
    },
    'child_cat_id': {
      type: DataTypes.INTEGER,
    },
    'child_cat_name': {
      type: DataTypes.STRING,
    },
    'child_cat_slug': {
      type: DataTypes.STRING,
    },
    'grandchild_cat_id': {
      type: DataTypes.INTEGER,
    },
    'grandchild_cat_name': {
      type: DataTypes.STRING,
    },
    'grandchild_cat_slug': {
      type: DataTypes.STRING,
    },
    'description': {
      type: DataTypes.STRING,
    },
    'is_master_cat': {
      type: DataTypes.BOOLEAN,
    },
    'is_child_cat': {
      type: DataTypes.BOOLEAN,
    },
    'is_grandchild_cat': {
      type: DataTypes.BOOLEAN,
    },
    'updated_at': {
      type: DataTypes.DATE,
    },
    'is_featured': {
      type: DataTypes.BOOLEAN,
    },
    'banner_image_url': {
      type: DataTypes.STRING,
    },
    'singles_banner_image_url': {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'stub_categories',
    underscored: true,
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};
