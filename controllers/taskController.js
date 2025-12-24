const Task = require('../models/taskModel');

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const task = new Task(req.body);
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create task', error: error.message });
    }
};

// Get tasks, can be filtered by assignedToId or leadId
exports.getTasks = async (req, res) => {
    try {
        const filter = {};
        if (req.query.assignedToId) {
            filter.assignedToId = req.query.assignedToId;
        }
        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
    }
};

// Get all tasks for a specific lead
exports.getTasksByLead = async (req, res) => {
    try {
        const tasks = await Task.find({ leadId: req.params.leadId }).sort({ createdAt: -1 });
        if (!tasks) {
            return res.status(404).json({ message: 'No tasks found for this lead.' });
        }
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tasks for lead', error: error.message });
    }
};

// Update a task's status
exports.updateTask = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Open', 'Done'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const updatedTask = await Task.findByIdAndUpdate(
            id,
            { status: status },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update task.', error: error.message });
    }
};