const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Públicas
router.post('/register', upload.fields([
  { name: 'cedula' }, { name: 'licencia' }, 
  { name: 'motoPhoto' }, { name: 'profilePhoto' }
]), authController.register);
router.post('/login', authController.login);

// Protegidas
router.get('/profile', auth, authController.getProfile);
router.put('/location', auth, authController.updateLocation);
router.put('/availability', auth, authController.updateAvailability);

// 📌 MANDADITOS (corregido)
router.get('/mandaditos', auth, authController.getAllMandaditos);
router.get('/mandaditos/:id', auth, authController.getMandaditoById);

module.exports = router;