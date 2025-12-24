const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// POST /api/tasks - Create a new task
router.post('/', taskController.createTask);

// GET /api/tasks - Get all tasks (can be filtered by query params like assignedToId)
router.get('/', taskController.getTasks);

// GET /api/tasks/lead/:leadId - Get all tasks for a specific lead
router.get('/lead/:leadId', taskController.getTasksByLead);

// PUT /api/tasks/:id - Update a task (e.g., change status)
router.put('/:id', taskController.updateTask);

module.exports = router;