const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchaseOrderController');

// Mejorar estructura RESTful
router.route('/:productId/pos')
    .post(controller.createOrUpdatePO)
    .get(controller.getPOsByProduct);

module.exports = router;