const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const applicationController = require('../controllers/applicationController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed!'), false);
        }
    }
});

// Application routes
router.get('/', applicationController.getAllApplications);
router.get('/:candidateId/:applicationIndex', applicationController.getApplicationById);
router.post('/', upload.single('resume'), applicationController.createApplication);
router.put('/:candidateId/:applicationIndex', applicationController.updateApplication);
router.delete('/:candidateId/:applicationIndex', applicationController.deleteApplication);

// Get applications by job posting
router.get('/job/:jobId', applicationController.getApplicationsByJob);

// Email routes
router.post('/send-shortlist-email', applicationController.sendShortlistEmail);
router.post('/send-reject-email', applicationController.sendRejectEmail);

module.exports = router;
