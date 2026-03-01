const Testimonial = require('../models/testimonialModel');

/* GET ALL */
exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .sort({ createdAt: -1 });

    res.status(200).json(testimonials);

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch testimonials' });
  }
};

/* CREATE */
exports.createTestimonial = async (req, res) => {
  try {
    const { name, role, quote } = req.body;

    if (!name || !quote) {
      return res.status(400).json({
        message: 'Name and review are required'
      });
    }

    const newTestimonial = await Testimonial.create({
      name,
      role,
      quote
    });

    res.status(201).json(newTestimonial);

  } catch (error) {
    res.status(500).json({ message: 'Failed to create testimonial' });
  }
};