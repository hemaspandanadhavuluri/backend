const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  candidateName: { type: String, required: true },
  position: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  interviewer: { type: String, required: true },
  interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['Phone Interview','Aptitude Test','Technical Test','Technical Interview','Manager Round', 'HR Interview', 'Final Interview'], required: true },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'], default: 'Scheduled' },
  rating: { type: Number, min: 1, max: 5, default: 0 },
  feedback: { type: String },
  notes: { type: String },
  scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Interview', InterviewSchema);
