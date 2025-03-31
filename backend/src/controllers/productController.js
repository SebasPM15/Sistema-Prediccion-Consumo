// Importar modelo y sequelize
const Product = require('../models/Product');
const sequelize = require('../config/database');
const { spawn } = require('child_process');
const path = require('path');

// Verificar conexión
sequelize.authenticate()
    .then(() => console.log('✅ Conexión a BD establecida'))
    .catch(err => console.error('❌ Error de conexión:', err));

// Obtener todos los productos
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.findAll();
        if (products.length === 0) {
            return res.status(404).json({ error: 'No se encontraron productos' });
        }
        res.json({ status: 'success', data: products });
    } catch (error) {
        console.error('❌ Error en getProducts:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};

// Crear un nuevo producto
exports.createProduct = async (req, res) => {
    const requiredFields = ['codigo', 'descripcion', 'unidCaja', 'stockTotal', 'consumos'];

    try {
        // Validación de campos requeridos
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Campos requeridos faltantes',
                missing: missingFields
            });
        }

        // Validar formato de consumos
        if (typeof req.body.consumos !== 'object' || Array.isArray(req.body.consumos)) {
            return res.status(400).json({
                error: 'El campo consumos debe ser un objeto con pares mes-valor'
            });
        }

        const newProduct = await Product.create({
            codigo: req.body.codigo,
            descripcion: req.body.descripcion,
            unidCaja: req.body.unidCaja,
            stockTotal: req.body.stockTotal,
            consumos: req.body.consumos
        });

        res.status(201).json({
            message: '✅ Producto creado exitosamente',
            data: newProduct
        });

    } catch (error) {
        console.error('❌ Error en createProduct:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'El código de producto ya existe' });
        }

        res.status(500).json({
            error: 'Error al crear producto',
            details: error.message
        });
    }
};

// Obtener un producto por código
exports.getProductByCode = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.codigo);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ status: 'success', data: product });
    } catch (error) {
        console.error('❌ Error en getProductByCode:', error);
        res.status(500).json({
            error: 'Error al obtener producto',
            details: error.message
        });
    }
};

// Actualizar un producto
exports.updateProduct = async (req, res) => {
    try {
        const [updated] = await Product.update(req.body, {
            where: { codigo: req.params.codigo }
        });

        if (updated === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const updatedProduct = await Product.findByPk(req.params.codigo);
        res.json({
            message: '✅ Producto actualizado exitosamente',
            data: updatedProduct
        });
    } catch (error) {
        console.error('❌ Error en updateProduct:', error);
        res.status(500).json({
            error: 'Error al actualizar producto',
            details: error.message
        });
    }
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.destroy({
            where: { codigo: req.params.codigo }
        });

        if (deleted === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: '✅ Producto eliminado exitosamente' });
    } catch (error) {
        console.error('❌ Error en deleteProduct:', error);
        res.status(500).json({
            error: 'Error al eliminar producto',
            details: error.message
        });
    }
};

// Obtener predicción de consumo usando Python
exports.getProductWithPrediction = async (req, res) => {
    try {
        const { codigo } = req.params;
        const product = await Product.findByPk(codigo);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Preparar input para Python
        const input = {
            codigo: product.codigo,
            stockTotal: product.stockTotal,
            unidCaja: product.unidCaja,
            consumos: product.consumos // Objeto JSON con los consumos
        };

        // Llamar al script de predicción en Python
        const python = spawn('python3', [path.join(__dirname, '../python/predict.py')]);
        let result = '';
        let errorOutput = '';

        python.stdin.write(JSON.stringify(input));
        python.stdin.end();

        python.stdout.on('data', (data) => {
            result += data.toString();
        });

        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        python.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).json({ status: 'error', message: errorOutput });
            }
            const prediction = JSON.parse(result);
            res.status(200).json({ status: 'success', data: { product, prediction } });
        });

    } catch (error) {
        console.error('❌ Error en getProductWithPrediction:', error);
        res.status(500).json({
            error: 'Error al obtener predicción',
            details: error.message
        });
    }
};
