// src/routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { protect } = require('../middlewares/authMiddleware'); // Import the middleware

// Routes for leads
router.get('/', leadController.getAllLeads); // GET all leads (with access control)
router.post('/', leadController.createLead); // POST create new lead (with auth for assignment)
router.get('/:id', leadController.getLeadById); // GET specific lead
router.put('/:id', leadController.updateLead); // PUT update lead

module.exports = router;
