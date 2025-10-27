const mongoose = require('mongoose');

const ApplicationSubSchema = new mongoose.Schema({
  jobPosting: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', required: true },
  coverLetter: { type: String },
  status: { type: String, enum: ['Applied', 'Reviewing', 'Shortlisted', 'Interviewed', 'Rejected', 'Hired', 'Completed'], default: 'Applied' },
  score: { type: Number, min: 0, max: 100, default: 0 },
  appliedDate: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date },
  education: { type: String },
  branch: { type: String },
  position: { type: String, required: true },
  stage: { type: String, enum: ['Applied', 'Reviewing', 'Interview', 'Offer', 'Hired', 'Rejected'], default: 'Applied' },
  score: { type: Number, min: 0, max: 100, default: 0 },
  appliedDate: { type: Date, default: Date.now },
  resume: { type: String }, // File path or URL
  skills: [{ type: String }],
  experience: { type: String },
  notes: { type: String },
  applications: [ApplicationSubSchema],
  interviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Interview' }],
  offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }]
}, { timestamps: true });

module.exports = mongoose.model('Candidate', CandidateSchema);
