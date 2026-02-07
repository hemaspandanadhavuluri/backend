const express = require('express');
const router = express.Router();
const emiController = require('../controllers/emiController');

/**
 * @route POST /api/emi/calculate
 * @desc Calculate EMI based on loan parameters
 * @access Public
 */



router.post('/calculate', emiController.calculateEMI);
router.post('/max-psi', emiController.getMaxPSI);

module.exports = router;
