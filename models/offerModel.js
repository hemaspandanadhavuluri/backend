const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  candidateName: { type: String, required: true },
  email: { type: String },
  position: { type: String, required: true },
  salary: { type: String, required: true },
  startDate: { type: Date },
  expiryDate: { type: Date, required: true },
  employmentType: { type: String },
  benefits: [{ type: String }],
  serviceAgreement: { type: String },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Expired', 'Withdrawn'], default: 'Pending' },
  offerDate: { type: Date, default: Date.now },
  offeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acceptedAt: { type: Date },
  rejectedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Offer', OfferSchema);
