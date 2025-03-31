'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('purchase_orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      producto_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'products', // Relación con la tabla products
          key: 'codigo'
        }
      },
      po_2573_air: Sequelize.INTEGER,
      po_v2565: Sequelize.INTEGER,
      po_v2576: Sequelize.INTEGER,
      po_v2580: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('purchase_orders');
  }
};