const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Job posting routes
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);
router.post('/', jobController.createJob);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);

// Additional job actions
router.patch('/:id/publish', jobController.publishJob);
router.patch('/:id/close', jobController.closeJob);

// Get active job titles for onboarding
router.get('/active/titles', jobController.getActiveJobTitles);

module.exports = router;
