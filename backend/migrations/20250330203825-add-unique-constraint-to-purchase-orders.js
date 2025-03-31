'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('purchase_orders', {
      fields: ['producto_id', 'mes', 'año'],
      type: 'unique',
      name: 'unique_po_per_product_month_year'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('purchase_orders', 'unique_po_per_product_month_year');
  }
};
