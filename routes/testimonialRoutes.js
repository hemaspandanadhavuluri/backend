const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');

// fetch all testimonials
router.get('/', testimonialController.getAllTestimonials);

// create new testimonial
router.post('/', testimonialController.createTestimonial);

module.exports = router;