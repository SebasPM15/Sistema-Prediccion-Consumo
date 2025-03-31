const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alert = sequelize.define('Alert', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    severity: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'alerts',
    timestamps: true,
    indexes: [{ fields: ['product_id'] }]
});

module.exports = Alert;
