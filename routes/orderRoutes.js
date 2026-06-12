const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// 🟢 RUTAS DE CREACIÓN Y CONSULTAS FIJAS (Van arriba)
router.post('/', auth, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/available', auth, orderController.getAvailableOrders);

// 🚀 ENLACE CORREGIDO: Maneja el endpoint de asignación directa del cliente
router.get('/available-drivers', auth, orderController.getAvailableDrivers);

// 🔵 RUTAS DINÁMICAS POR ID (Van abajo)
router.get('/:orderId', auth, orderController.getOrderById);
router.put('/:orderId/accept', auth, orderController.acceptOrder);
router.put('/:orderId/status', auth, orderController.updateOrderStatus);
router.post('/:orderId/rate', auth, orderController.rateOrder);

module.exports = router;