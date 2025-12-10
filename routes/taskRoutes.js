const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Routes for tasks
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/lead/:leadId', taskController.getTasksForLead); // New route

module.exports = router;