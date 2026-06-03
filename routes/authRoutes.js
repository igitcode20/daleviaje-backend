const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Rutas públicas
router.post('/register', upload.fields([
  { name: 'cedula', maxCount: 1 },
  { name: 'licencia', maxCount: 1 },
  { name: 'motoPhoto', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 }
]), authController.register);

router.post('/login', authController.login);

// Rutas protegidas
router.get('/profile', auth, authController.getProfile);
router.put('/location', auth, authController.updateLocation);
router.put('/availability', auth, authController.updateAvailability);
router.put('/profile', auth, authController.updateProfile);
router.post('/change-password', auth, authController.changePassword);

// 👇 NUEVAS RUTAS PARA MANDADITOS
router.get('/mandaditos', auth, authController.getAllMandaditos);
router.get('/mandaditos/:id', auth, authController.getMandaditoById);
router.post('/assign-order', auth, authController.assignOrderToMandadito);

module.exports = router;