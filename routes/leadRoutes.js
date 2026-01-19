// src/routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const upload = require('../middlewares/uploadMiddleware'); // Import multer middleware
const { protect } = require('../middlewares/authMiddleware'); // Import the middleware

// Routes for leads
router.get('/', leadController.getAllLeads); // GET all leads (with access control)
router.post('/', leadController.createLead); // POST create new lead (with auth for assignment)
router.get('/counsellor/:counsellorId', leadController.getCounsellorLeads); // GET all leads for a counsellor
router.get('/messages/:counsellorId', leadController.getCounsellorMessages); // GET all messages for a counsellor
router.get('/:id', leadController.getLeadById); // GET specific lead
router.put('/:id', leadController.updateLead); // PUT update lead
router.post('/:id/assign-bank', leadController.assignToBank); // POST assign lead to a bank
router.post('/:id/upload-document', upload.single('document'), leadController.uploadDocument); // NEW: Upload document route
router.post('/:id/send-document-link', leadController.sendDocumentLink); // NEW: Send document link route
router.post('/:id/send-email', leadController.sendTemplateEmail); // NEW: Send generic template email
router.get('/stats/:counsellorId', leadController.getCounsellorStats); // NEW: Get counsellor stats
router.get('/recent/:counsellorId', leadController.getRecentSubmissionsForCounsellor); // NEW: Get recent submissions for counsellor


module.exports = router;
