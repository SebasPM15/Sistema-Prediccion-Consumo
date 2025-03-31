const { predictStock } = require('../services/aiService');
const { sendStockAlerts } = require('../services/alertService');
const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');

exports.getPredictions = async (req, res) => {
    try {
        const { productCode } = req.params;
        
        // Buscar el producto por su código
        const product = await Product.findOne({ where: { codigo: productCode } });
        
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

        // Buscar las órdenes de compra ya existentes para el producto
        const pos = await PurchaseOrder.findAll({
            where: { 
                producto_id: productCode, 
                estado: ['pendiente', 'parcial'] // Solo las órdenes no completadas
            }
        });

        // Agregar un log para ver qué datos estamos pasando
        console.log('Datos del producto:', product);

        // Llamar a la función para predecir el stock, incluyendo las órdenes de compra existentes
        const prediction = await predictStock(product.codigo, pos);

        // Agregar un log para ver la predicción antes de responder
        console.log('Predicción:', prediction);

        // Enviar alertas si es necesario
        await sendStockAlerts(product, prediction);

        // Responder con el producto y la predicción
        res.json({
            status: 'success',
            data: {
                product: product.toJSON(),
                prediction
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
