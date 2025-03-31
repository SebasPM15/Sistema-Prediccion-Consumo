// src/models/index.js
const Product = require('./Product');
const PurchaseOrder = require('./PurchaseOrder');
const Alert = require('./Alert');

const defineAssociations = () => {
    // Product -> PurchaseOrder (1:N)
    Product.hasMany(PurchaseOrder, {
        foreignKey: 'producto_id',
        sourceKey: 'codigo'
    });

    PurchaseOrder.belongsTo(Product, {
        foreignKey: 'producto_id',
        targetKey: 'codigo'
    });

    // Product -> Alert (1:N)
    Product.hasMany(Alert, {
        foreignKey: 'product_id',
        sourceKey: 'codigo'
    });

    Alert.belongsTo(Product, {
        foreignKey: 'product_id',
        targetKey: 'codigo'
    });
};

// Exportamos los modelos y la función para definir las asociaciones.
module.exports = {
    Product,
    PurchaseOrder,
    Alert,
    defineAssociations
};
