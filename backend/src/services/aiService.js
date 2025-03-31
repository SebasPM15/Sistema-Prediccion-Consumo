const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');

const predictStock = async (productId) => {
    try {
        // Obtener producto y órdenes de compra
        const product = await Product.findByPk(productId);
        if (!product) throw new Error('Producto no encontrado');

        const pos = await PurchaseOrder.findAll({
            where: {
                producto_id: productId,
                estado: ['pendiente', 'parcial']
            }
        });

        // Validar que haya al menos 5 consumos históricos
        if (!product.consumos || product.consumos.length < 5) {
            throw new Error('Se requieren al menos 5 meses de consumo histórico');
        }

        // Calcular stock proyectado considerando órdenes de compra pendientes
        const totalOrdenesPendientes = pos.reduce((acc, order) => acc + order.cantidad, 0);
        const stockProyectado = product.stockTotal + totalOrdenesPendientes;

        // Construir input para Python
        const inputData = {
            CODIGO: product.codigo,
            STOCK_TOTAL: product.stockTotal,
            UNID_CAJA: product.unidCaja,
            consumos: product.consumos,
            purchase_orders: formatPurchaseOrders(pos) // Nueva clave
        };

        const prediction = await executePythonScript(inputData);
        
        // Verificar si se recomienda una nueva orden de compra
        if (prediction.recomendacion_compra) {
            const nuevaOrden = await PurchaseOrder.create({
                producto_id: productId,
                cantidad: prediction.cantidad_sugerida,
                estado: 'pendiente',
                fecha_entrega: new Date() // Puedes modificar la fecha de entrega según el negocio
            });
            prediction.nueva_orden = nuevaOrden;
        }

        return prediction;
    } catch (error) {
        throw new Error(`Error en predicción: ${error.message}`);
    }
};

const formatPurchaseOrders = (orders) => {
    return orders.reduce((acc, order) => {
        const key = `${order.mes}-${order.año}`.toUpperCase();
        acc[key] = (acc[key] || 0) + order.cantidad;
        return acc;
    }, {});
};

const executePythonScript = (inputData) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', '..', '..', 'ai_model', 'src', 'predict.py');

        if (!fs.existsSync(scriptPath)) {
            return reject(new Error(`Script Python no encontrado: ${scriptPath}`));
        }

        const pythonProcess = spawn('python', [scriptPath], {
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });

        const timeout = setTimeout(() => {
            pythonProcess.kill();
            reject(new Error("Timeout excedido (30s)"));
        }, 30000);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => output += data.toString());
        pythonProcess.stderr.on('data', (data) => errorOutput += data.toString());

        pythonProcess.on('close', (code) => {
            clearTimeout(timeout);

            if (code !== 0) {
                return reject(new Error(`Python error (${code}): ${errorOutput}`));
            }

            try {
                resolve(JSON.parse(output));
            } catch (e) {
                reject(new Error(`Error parseando JSON: ${e.message}`));
            }
        });
    });
};

module.exports = { predictStock };
