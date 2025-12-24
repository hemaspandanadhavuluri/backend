const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');

// Route to get all tied-up banks
router.get('/', bankController.getAllBanks);

// NEW: GET banks by pincode
router.get('/search-by-pincode', bankController.searchBanksByPincode);

module.exports = router;