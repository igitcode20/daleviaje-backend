const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/', auth, orderController.createOrder);
router.put('/:orderId/accept', auth, orderController.acceptOrder);
router.put('/:orderId/status', auth, orderController.updateOrderStatus);
router.post('/:orderId/rate', auth, orderController.rateOrder);
router.get('/my-orders', auth, orderController.getUserOrders);

module.exports = router;