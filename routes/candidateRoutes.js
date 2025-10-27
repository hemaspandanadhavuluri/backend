const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');

// Candidate routes
router.get('/', candidateController.getAllCandidates);
router.get('/:id', candidateController.getCandidateById);
router.post('/', candidateController.createCandidate);
router.put('/:id', candidateController.updateCandidate);
router.delete('/:id', candidateController.deleteCandidate);

// Get candidate by email
router.get('/email/:email', candidateController.getCandidateByEmail);

// Add related entities to candidate
router.post('/add-application', candidateController.addApplicationToCandidate);
router.post('/add-interview', candidateController.addInterviewToCandidate);
router.post('/add-offer', candidateController.addOfferToCandidate);

module.exports = router;
