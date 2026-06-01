const express = require('express');
const router = express.Router();
const creditController = require('../controllers/creditController');
const auth = require('../middleware/auth');

router.get('/packages', auth, creditController.getCreditPackages);
router.post('/request', auth, creditController.requestCreditRecharge);
router.post('/confirm', auth, creditController.confirmRecharge); // Solo admin
router.get('/my-credits', auth, creditController.getUserCredits);

module.exports = router;