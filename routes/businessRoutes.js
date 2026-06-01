const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', businessController.getBusinesses);
router.get('/:id', businessController.getBusinessById);
router.post('/register', auth, upload.array('photos', 10), businessController.registerBusiness);
router.post('/:id/rate', auth, businessController.rateBusiness);

module.exports = router;