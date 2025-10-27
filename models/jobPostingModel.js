const mongoose = require('mongoose');

const JobPostingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  numPostings: { type: Number, default: 1 },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], required: true },
  endDate: { type: Date },
  priority: { type: String, enum: ['Urgent', 'High', 'Medium', 'Low'], default: 'Medium' },
  experienceLevel: { type: String, required: true },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  description: { type: String, required: true },
  skills: [{ type: String }],
  benefits: [{ type: String }],
  status: { type: String, enum: ['Draft', 'Active', 'Closed'], default: 'Draft' },
  postedDate: { type: Date, default: Date.now },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }]
}, { timestamps: true });

module.exports = mongoose.model('JobPosting', JobPostingSchema);
