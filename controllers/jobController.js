const JobPosting = require('../models/jobPostingModel');
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'justtapnagendra@gmail.com',
        pass: process.env.EMAIL_PASS || 'lfxs gaqv ldyd rwnj'
    }
});

/**
 * Get all job postings
 */
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await JobPosting.find().populate('postedBy', 'fullName').sort({ createdAt: -1 });
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Server error fetching jobs.' });
    }
};

/**
 * Get job posting by ID
 */
exports.getJobById = async (req, res) => {
    try {
        const job = await JobPosting.findById(req.params.id).populate('postedBy', 'fullName');
        if (!job) {
            return res.status(404).json({ message: 'Job posting not found.' });
        }
        res.status(200).json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ message: 'Server error fetching job.' });
    }
};

/**
 * Create a new job posting
 */
exports.createJob = async (req, res) => {
    const { title, department, numPostings, employmentType, endDate, priority, experienceLevel, salaryMin, salaryMax, description, skills, benefits, status } = req.body;

    try {
        const job = await JobPosting.create({
            title,
            department,
            numPostings,
            employmentType,
            endDate,
            priority,
            experienceLevel,
            salaryMin,
            salaryMax,
            description,
            skills: skills ? skills.split(',').map(s => s.trim()) : [],
            benefits: benefits ? benefits.split(',').map(b => b.trim()) : [],
            status,
            postedBy: req.user ? req.user._id : '507f1f77bcf86cd799439011' // Default user ID for now
        });

        res.status(201).json({ message: 'Job posting created successfully.', job });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ message: 'Server error creating job.' });
    }
};

/**
 * Update job posting
 */
exports.updateJob = async (req, res) => {
    const { title, department, numPostings, employmentType, endDate, priority, experienceLevel, salaryMin, salaryMax, description, skills, benefits, status } = req.body;

    try {
        const job = await JobPosting.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job posting not found.' });
        }

        job.title = title || job.title;
        job.department = department || job.department;
        job.numPostings = numPostings || job.numPostings;
        job.employmentType = employmentType || job.employmentType;
        job.endDate = endDate || job.endDate;
        job.priority = priority || job.priority;
        job.experienceLevel = experienceLevel || job.experienceLevel;
        job.salaryMin = salaryMin || job.salaryMin;
        job.salaryMax = salaryMax || job.salaryMax;
        job.description = description || job.description;
        job.skills = skills ? skills.split(',').map(s => s.trim()) : job.skills;
        job.benefits = benefits ? benefits.split(',').map(b => b.trim()) : job.benefits;
        job.status = status || job.status;

        await job.save();
        res.status(200).json({ message: 'Job posting updated successfully.', job });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ message: 'Server error updating job.' });
    }
};

/**
 * Delete job posting
 */
exports.deleteJob = async (req, res) => {
    try {
        const job = await JobPosting.findByIdAndDelete(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job posting not found.' });
        }
        res.status(200).json({ message: 'Job posting deleted successfully.' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Server error deleting job.' });
    }
};

/**
 * Publish job posting (change status to Active)
 */
exports.publishJob = async (req, res) => {
    try {
        const job = await JobPosting.findByIdAndUpdate(req.params.id, { status: 'Active' }, { new: true });
        if (!job) {
            return res.status(404).json({ message: 'Job posting not found.' });
        }
        res.status(200).json({ message: 'Job posting published successfully.', job });
    } catch (error) {
        console.error('Error publishing job:', error);
        res.status(500).json({ message: 'Server error publishing job.' });
    }
};

/**
 * Close job posting
 */
exports.closeJob = async (req, res) => {
    try {
        const job = await JobPosting.findByIdAndUpdate(req.params.id, { status: 'Closed' }, { new: true });
        if (!job) {
            return res.status(404).json({ message: 'Job posting not found.' });
        }
        res.status(200).json({ message: 'Job posting closed successfully.', job });
    } catch (error) {
        console.error('Error closing job:', error);
        res.status(500).json({ message: 'Server error closing job.' });
    }
};

/**
 * Get active job posting titles for onboarding roles
 */
exports.getActiveJobTitles = async (req, res) => {
    try {
        const activeJobs = await JobPosting.find({ status: 'Active' })
            .select('title')
            .sort({ createdAt: -1 });
        const titles = activeJobs.map(job => job.title);
        res.status(200).json(titles);
    } catch (error) {
        console.error('Error fetching active job titles:', error);
        res.status(500).json({ message: 'Server error fetching job titles.' });
    }
};
