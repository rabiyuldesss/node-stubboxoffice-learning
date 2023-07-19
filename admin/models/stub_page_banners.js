module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('stub_page_banners', {
    'image_url': {
      type: DataTypes.STRING,
    },
    'slug': {
      type: DataTypes.STRING,
    },
    'is_page': {
      type: DataTypes.BOOLEAN,
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
    'image_link': {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'stub_page_banners',
    underscored: true,
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};

