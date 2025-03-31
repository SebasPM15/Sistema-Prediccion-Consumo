const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');

// Obtener predicciones de un producto
router.get('/:productCode/predict', predictController.getPredictions);

module.exports = router;
