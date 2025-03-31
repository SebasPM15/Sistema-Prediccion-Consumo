'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PurchaseOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PurchaseOrder.init({
    producto_id: DataTypes.STRING,
    po_2573_air: DataTypes.INTEGER,
    po_v2565: DataTypes.INTEGER,
    po_v2576: DataTypes.INTEGER,
    po_v2580: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'PurchaseOrder',
  });
  return PurchaseOrder;
};