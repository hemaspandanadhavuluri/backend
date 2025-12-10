const Task = require('../models/taskModel');
const mongoose = require('mongoose');

/**
 * Create a new task.
 * @route POST /api/tasks
 */
exports.createTask = async (req, res) => {
    const { leadId, assignedToId, assignedToName, subject, body } = req.body;
    // In a real app, createdById and createdByName would come from `req.user` (auth middleware)
    const { createdById, createdByName } = req.body; // MOCKING for now

    if (!leadId || !assignedToId || !subject || !createdById || !createdByName) {
        return res.status(400).json({ message: 'Missing required fields: leadId, assignedToId, subject, and creator info.' });
    }

    try {
        const task = await Task.create({
            leadId,
            assignedToId,
            assignedToName,
            subject,
            body,
            createdById,
            createdByName,
        });
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error while creating task.' });
    }
};

/**
 * Get tasks, filtered by assignedToId.
 * @route GET /api/tasks
 */
exports.getTasks = async (req, res) => {
    const { assignedToId } = req.query;
    if (!assignedToId) {
        return res.status(400).json({ message: 'An assignedToId is required to fetch tasks.' });
    }

    try {
        const tasks = await Task.find({ assignedToId }).sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error while fetching tasks.' });
    }
};

/**
 * Get all tasks for a specific lead.
 * @route GET /api/tasks/lead/:leadId
 */
exports.getTasksForLead = async (req, res) => {
    const { leadId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
        return res.status(400).json({ message: 'Invalid Lead ID.' });
    }

    try {
        const tasks = await Task.find({ leadId }).sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks for lead:', error);
        res.status(500).json({ message: 'Server error while fetching tasks for lead.' });
    }
};