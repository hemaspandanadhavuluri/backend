const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');

// Routes
router.get('/pending', trainingController.getPendingTrainings);
router.get('/all', trainingController.getAllTrainings);
router.get('/status/:status', trainingController.getTrainingsByStatus);
router.get('/employee/:employeeId', trainingController.getTrainingsByEmployee);
router.get('/:id', trainingController.getTrainingById);

router.post('/', trainingController.createTraining);

router.put('/:id/schedule', trainingController.scheduleTraining);
router.put('/:id/assign-trainer', trainingController.assignTrainer);
router.put('/:id/progress', trainingController.updateProgress);
router.put('/:id/complete', trainingController.completeTraining);

router.delete('/:id', trainingController.deleteTraining);

module.exports = router;
