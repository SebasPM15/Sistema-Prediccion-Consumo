const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');

// Obtener todos los productos
router.get('/', controller.getProducts);

// Crear un nuevo producto
router.post('/', controller.createProduct);

// Obtener un producto por código
router.get('/:productId', controller.getProductByCode);

// Actualizar un producto por código
router.put('/:productId', controller.updateProduct);

// Eliminar un producto por código
router.delete('/:productId', controller.deleteProduct);

module.exports = router;
