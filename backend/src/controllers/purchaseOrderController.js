const { PurchaseOrder, Product } = require('../models'); // Importamos desde index.js
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');

// Método para crear o actualizar la orden de compra
exports.createOrUpdatePO = async (req, res) => {
    try {
        // 1. Validar parámetros y body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        const { productId } = req.params; // Este productId es el codigo del producto
        const { mes, año, cantidad, fecha_entrega, po_recibido } = req.body;

        // 2. Formatear y validar datos
        const formattedMes = mes.toUpperCase().substring(0, 3);
        const formattedAño = parseInt(año);
        const formattedCantidad = Math.max(0, parseInt(cantidad));
        const formattedPoRecibido = po_recibido ? parseInt(po_recibido) : 0;

        // 3. Verificar si el producto existe
        const product = await Product.findOne({ where: { codigo: productId } });
        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Producto no encontrado'
            });
        }

        // 4. Upsert con transacción
        const result = await sequelize.transaction(async (t) => {
            // En purchaseOrderController.js, actualizar el upsert:
            const [po, created] = await PurchaseOrder.upsert({
                producto_id: productId,
                mes: formattedMes,
                año: formattedAño,
                cantidad: formattedCantidad,
                fecha_entrega: new Date(fecha_entrega),
                estado: 'pendiente',
                po_recibido: formattedPoRecibido
            }, {
                returning: true,
                transaction: t,
                conflictFields: ['producto_id', 'mes', 'año'], // Debe coincidir con la restricción
                updateOnDuplicate: ['cantidad', 'fecha_entrega', 'estado', 'po_recibido'] // Campos a actualizar
            });

            return {
                po,
                created
            };
        });

        // 5. Respuesta estandarizada
        res.status(result.created ? 201 : 200).json({
            status: 'success',
            message: result.created ? 'PO creada exitosamente' : 'PO actualizada',
            data: result.po
        });

    } catch (error) {
        // 6. Manejo específico de errores
        let statusCode = 500;
        let errorMessage = error.message;
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            statusCode = 404;
            errorMessage = 'Producto no encontrado';
        }
        
        if (error.name === 'SequelizeValidationError') {
            statusCode = 400;
            errorMessage = error.errors.map(e => e.message).join(', ');
        }

        res.status(statusCode).json({
            status: 'error',
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : null
        });
    }
};

// Método para obtener todas las órdenes de compra de un producto
exports.getPOsByProduct = async (req, res) => {
    try {
        const pos = await PurchaseOrder.findAll({
            where: { producto_id: req.params.productId } // Usamos codigo del producto
        });
        res.json(pos);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
