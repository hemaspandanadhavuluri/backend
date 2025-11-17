const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.resolve(__dirname, '../uploads'));
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
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed!'));
        }
    }
});

// Routes
router.post('/submit', upload.fields([
    { name: 'profileUpload', maxCount: 1 },
    { name: 'aadharUpload', maxCount: 1 },
    { name: 'panUpload', maxCount: 1 },
    { name: 'bankStatementUpload', maxCount: 1 }
]), onboardingController.submitOnboarding);

router.get('/pending', onboardingController.getPendingOnboardings);
router.get('/approved', onboardingController.getApprovedOnboardings);
router.get('/onboarded', onboardingController.getOnboardedOnboardings);
router.get('/:id', onboardingController.getOnboardingById);
//added now
router.get('/:id/salary', onboardingController.getSalary);
router.put('/:id/approve', onboardingController.approveOnboarding);
router.put('/:id/raise-issue', onboardingController.raiseIssue);
router.put('/:id/complete', onboardingController.completeOnboarding);
router.post('/final-onboard', onboardingController.finalOnboard);
router.post('/send-form-link', onboardingController.sendFormLink);
router.put('/update/:id', upload.fields([
    { name: 'profileUpload', maxCount: 1 },
    { name: 'aadharUpload', maxCount: 1 },
    { name: 'panUpload', maxCount: 1 },
    { name: 'bankStatementUpload', maxCount: 1 }
]), onboardingController.updateOnboarding);

module.exports = router;
