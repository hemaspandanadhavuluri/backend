const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');

// Route to get all tied-up banks
router.get('/', bankController.getAllBanks);

// NEW: GET banks by pincode
router.get('/search-by-pincode', bankController.searchBanksByPincode);

// NEW: Route to get connected banks by type (public or private)
router.get('/connected/:type', bankController.getConnectedBanksByType);

module.exports = router;