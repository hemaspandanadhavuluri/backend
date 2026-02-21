const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');

// Route to get all tied-up banks
router.get('/', bankController.getAllBanks);

// NEW: GET banks by pincode
router.get('/search-by-pincode', bankController.searchBanksByPincode);

// NEW: Route to get connected banks by type (public or private)
router.get('/connected/:type', bankController.getConnectedBanksByType);

// NEW: Create a new bank
router.post('/', bankController.createBank);

// NEW: Update a bank
router.put('/:id', bankController.updateBank);

// NEW: Delete a bank
router.delete('/:id', bankController.deleteBank);

// NEW: Add a Relationship Manager to a bank
router.post('/:id/rm', bankController.addRelationshipManager);

// NEW: Update a Relationship Manager
router.put('/:id/rm/:rmId', bankController.updateRelationshipManager);

// NEW: Delete a Relationship Manager
router.delete('/:id/rm/:rmId', bankController.deleteRelationshipManager);

module.exports = router;
