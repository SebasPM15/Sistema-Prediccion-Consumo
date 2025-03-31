const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
    producto_id: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Código del producto relacionado',
        references: {
            model: 'products',
            key: 'codigo'
        }
    },
    mes: {
        type: DataTypes.STRING(3),
        allowNull: false,
        set(value) {
            // Convertir DEC -> DIC automáticamente
            this.setDataValue('mes', value.toUpperCase().replace('DEC', 'DIC'));
        },
        validate: {
            isIn: [['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
                    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']]
        }
    },
    año: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 2020
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { 
            min: 0,
            max: 100000 // Límite razonable
        }
    },
    po_recibido: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
            max: function() {
                // No puede recibir más de lo pedido
                return this.cantidad;
            }
        }
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'parcial', 'completado', 'cancelado'),
        defaultValue: 'pendiente',
        validate: {
            validEstado(value) {
                if (this.po_recibido === this.cantidad && value !== 'completado') {
                    throw new Error('Estado debe ser completado cuando se recibe toda la cantidad');
                }
            }
        }
    }
}, {
    tableName: 'purchase_orders',
    timestamps: true,
    paranoid: true, // Para soft deletes
    hooks: {
        beforeSave: (po) => {
            // Actualizar estado automáticamente
            if (po.po_recibido > 0 && po.po_recibido < po.cantidad) {
                po.estado = 'parcial';
            }
            if (po.po_recibido === po.cantidad) {
                po.estado = 'completado';
            }
        }
    },
    indexes: [
        {
            unique: true,
            fields: ['producto_id', 'mes', 'año'],
            name: 'unique_po_per_month'
        },
        {
            fields: ['estado']
        }
    ],
    getterMethods: {
        mes_año() {
            return `${this.mes}-${this.año}`;
        }
    }
});

// Método para obtener PO en formato de predicción
PurchaseOrder.prototype.toPredictionFormat = function() {
    return {
        mes: this.mes,
        año: this.año,
        cantidad: this.cantidad,
        recibido: this.po_recibido,
        estado: this.estado
    };
};

module.exports = PurchaseOrder;