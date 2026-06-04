const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Rutas
router.post('/', auth, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/available', auth, orderController.getAvailableOrders);
router.get('/:orderId', auth, orderController.getOrderById);
router.put('/:orderId/accept', auth, orderController.acceptOrder);
router.put('/:orderId/status', auth, orderController.updateOrderStatus);
router.post('/:orderId/rate', auth, orderController.rateOrder);

// 👇 ESTAS FUNCIONES DEBEN EXISTIR EN orderController.js
// Si no existen, coméntalas o créalas
// router.post('/:orderId/cancel', auth, orderController.cancelOrder);
// router.post('/:orderId/confirm-delivery', auth, orderController.confirmDelivery);
// router.post('/update-location', auth, orderController.updateLocation);

module.exports = router;