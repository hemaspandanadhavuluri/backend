const express = require('express');
const router = express.Router();
const bankComparisonController = require('../controllers/bankComparisonController');

// GET /api/bank-comparisons - Fetch all bank comparisons
router.get('/', bankComparisonController.getAllBankComparisons);

// GET /api/bank-comparisons/:bankName - Fetch comparison for a specific bank
router.get('/:bankName', bankComparisonController.getBankComparisonByName);

// POST /api/bank-comparisons - Create a new bank comparison
router.post('/', bankComparisonController.createBankComparison);

// PUT /api/bank-comparisons/:bankName - Update a bank comparison
router.put('/:bankName', bankComparisonController.updateBankComparison);

// DELETE /api/bank-comparisons/:bankName - Delete a bank comparison
router.delete('/:bankName', bankComparisonController.deleteBankComparison);

module.exports = router;
