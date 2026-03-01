const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String },
    quote: { type: String, required: true },
    img: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', TestimonialSchema);