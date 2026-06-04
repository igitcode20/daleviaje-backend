const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Rutas existentes...
router.post('/', auth, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/available', auth, orderController.getAvailableOrders); // 👈 ESTA RUTA FALTA
router.put('/:orderId/accept', auth, orderController.acceptOrder);
router.put('/:orderId/status', auth, orderController.updateOrderStatus);
router.post('/:orderId/rate', auth, orderController.rateOrder);

module.exports = router;