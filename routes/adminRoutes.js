const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Todas las rutas de admin requieren autenticación y rol de admin
router.use(auth, adminAuth);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Usuarios
router.get('/users', adminController.getUsers);
router.post('/users/:userId/credits', adminController.updateUserCredits);
router.put('/users/:userId/status', adminController.toggleUserStatus);

// Pedidos
router.get('/orders', adminController.getOrders);
router.get('/orders/:orderId', adminController.getOrderById);
router.put('/orders/:orderId/status', adminController.updateOrderStatus);

// Negocios
router.get('/businesses', adminController.getBusinesses);
router.post('/businesses', adminController.createBusiness);
router.put('/businesses/:businessId', adminController.updateBusiness);
router.delete('/businesses/:businessId', adminController.deleteBusiness);

// Recargas
router.get('/recharges', adminController.getRecharges);
router.post('/recharges/:rechargeId/approve', adminController.approveRecharge);
router.post('/recharges/:rechargeId/reject', adminController.rejectRecharge);

module.exports = router;