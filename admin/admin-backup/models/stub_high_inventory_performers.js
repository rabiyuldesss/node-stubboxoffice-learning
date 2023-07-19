module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('stub_high_inventory_performers', {
    'performer_id': {
      type: DataTypes.INTEGER,
    },
    'performer_name': {
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
    tableName: 'stub_high_inventory_performers',
    underscored: true,
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};

