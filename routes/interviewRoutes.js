const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

// Interview routes
router.get('/', interviewController.getAllInterviews);
router.get('/:id', interviewController.getInterviewById);
router.post('/', interviewController.createInterview);
router.put('/:id', interviewController.updateInterview);
router.delete('/:id', interviewController.deleteInterview);

// Get interviews by application
router.get('/application/:applicationId', interviewController.getInterviewsByApplication);

module.exports = router;
