const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    role: {
      type: String,
      trim: true,
      default: ''
    },
    quote: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);