const express = require('express');
const router = express.Router();
const creditController = require('../controllers/creditController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Rutas de créditos
router.get('/packages', auth, creditController.getCreditPackages);
router.post('/request', auth, upload.single('voucher'), creditController.requestRecharge);
router.get('/my-credits', auth, creditController.getUserCredits);

module.exports = router;