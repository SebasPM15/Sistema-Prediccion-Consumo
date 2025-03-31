const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    codigo: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    unidCaja: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'unid_caja'
    },
    stockTotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'stock_total'
    },
    consumos: {
        type: DataTypes.JSONB, // Guardamos objeto JSON { "ENE 2024": 100, "FEB 2024": 15, ... }
        allowNull: false
    }
}, {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    freezeTableName: true
});

module.exports = Product;
