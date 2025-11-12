const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');

// Route to get all tied-up banks
router.get('/', bankController.getAllBanks);

module.exports = router;