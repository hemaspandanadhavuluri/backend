const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Routes for tasks
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/lead/:leadId', taskController.getTasksByLead); // New route
router.put('/:id', taskController.updateTask);

module.exports = router;