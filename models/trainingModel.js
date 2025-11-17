const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  trainingType: {
    type: String,
    required: true,
    enum: ['Onboarding Training', 'Technical Training', 'Soft Skills Training', 'Compliance Training']
  },
  trainer: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'in-progress', 'completed'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  date: {
    type: String,
    default: ''
  },
  time: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
trainingSchema.index({ employeeId: 1, status: 1 });
trainingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Training', trainingSchema);
