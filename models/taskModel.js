const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },
    assignedToId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedToName: { type: String, required: true },
    createdById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdByName: { type: String, required: true },
    subject: {
        type: String,
        required: [true, 'Task subject is required.'],
        trim: true
    },
    body: { type: String, trim: true },
    status: { type: String, enum: ['Open', 'Completed'], default: 'Open' },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);