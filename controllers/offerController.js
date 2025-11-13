const Offer = require('../models/offerModel');
const Candidate = require('../models/candidateModel');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'justtapnagendra@gmail.com',
        pass: process.env.EMAIL_PASS || 'lfxs gaqv ldyd rwnj'
    }
});

/**
 * Get all offers
 */
exports.getAllOffers = async (req, res) => {
    try {
        const offers = await Offer.find()
            .populate('application', 'name email')
            .populate('offeredBy', 'fullName')
            .sort({ offerDate: -1 });
        res.status(200).json(offers);
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ message: 'Server error fetching offers.' });
    }
};

/**
 * Get offer by ID
 */
exports.getOfferById = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id)
            .populate('application', 'name email phone')
            .populate('offeredBy', 'fullName');
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found.' });
        }
        res.status(200).json(offer);
    } catch (error) {
        console.error('Error fetching offer:', error);
        res.status(500).json({ message: 'Server error fetching offer.' });
    }
};

/**
 * Create a new offer
 */
exports.createOffer = async (req, res) => {
    const { application, candidateName, email, position, salary, startDate, expiryDate, employmentType, benefits, serviceAgreement, notes } = req.body;

    try {
        // Check if candidate exists
        let candidate = null;
        if (application) {
            candidate = await Candidate.findById(application);
            if (!candidate) {
                return res.status(404).json({ message: 'Candidate not found.' });
            }
        }

        const offer = await Offer.create({
            application,
            candidateName,
            email,
            position,
            salary,
            startDate,
            expiryDate,
            employmentType,
            benefits: benefits ? benefits.split(',').map(b => b.trim()) : [],
            serviceAgreement,
            notes,
            offeredBy: req.user ? req.user._id : null
        });

        // Update candidate's application status if candidate exists
        if (candidate) {
            const appIndex = candidate.applications.findIndex(app => app._id.toString() === application.toString());
            if (appIndex !== -1) {
                candidate.applications[appIndex].status = 'Offer';
                await candidate.save();
            }
            // Send offer email
            await sendOfferEmail(offer, candidate);
        }

        // Update user's salary if user exists by email
        const User = require('../models/userModel');
        const user = await User.findOne({ email: offer.email });
        if (user) {
            user.salary = parseFloat(offer.salary) || 0;
            await user.save();
        }

        res.status(201).json(offer);
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ message: 'Server error creating offer.' });
    }
};

/**
 * Update offer
 */
exports.updateOffer = async (req, res) => {
    const { salary, benefits, status, expiryDate, notes } = req.body;

    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found.' });
        }

        const originalStatus = offer.status;

        offer.salary = salary || offer.salary;
        offer.benefits = benefits ? benefits.split(',').map(b => b.trim()) : offer.benefits;
        offer.status = status || offer.status;
        offer.expiryDate = expiryDate || offer.expiryDate;
        offer.notes = notes || offer.notes;

        if (status === 'Accepted') {
            offer.acceptedAt = new Date();
            // Update candidate's application status
            const candidate = await Candidate.findById(offer.application);
            if (candidate) {
                const appIndex = candidate.applications.findIndex(app => app._id.toString() === offer.application.toString());
                if (appIndex !== -1) {
                    candidate.applications[appIndex].status = 'Hired';
                    await candidate.save();
                }
            }
        } else if (status === 'Rejected') {
            offer.rejectedAt = new Date();
            // Update candidate's application status
            const candidate = await Candidate.findById(offer.application);
            if (candidate) {
                const appIndex = candidate.applications.findIndex(app => app._id.toString() === offer.application.toString());
                if (appIndex !== -1) {
                    candidate.applications[appIndex].status = 'Rejected';
                    await candidate.save();
                }
            }
        }

        await offer.save();

        // Update user's salary if salary changed and user exists by email
        if (salary !== undefined) {
            const User = require('../models/userModel');
            const user = await User.findOne({ email: offer.email });
            if (user) {
                user.salary = parseFloat(offer.salary) || 0;
                await user.save();
            }
        }

        // Send status update email
        if (status && status !== originalStatus) {
            const candidate = await Candidate.findById(offer.application);
            await sendOfferStatusEmail(offer, candidate, status);
        }

        res.status(200).json(offer);
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ message: 'Server error updating offer.' });
    }
};

/**
 * Delete offer
 */
exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found.' });
        }
        res.status(200).json({ message: 'Offer deleted successfully.' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ message: 'Server error deleting offer.' });
    }
};

/**
 * Get offers by application
 */
exports.getOffersByApplication = async (req, res) => {
    try {
        const offers = await Offer.find({ application: req.params.applicationId })
            .populate('offeredBy', 'fullName')
            .sort({ offerDate: -1 });
        res.status(200).json(offers);
    } catch (error) {
        console.error('Error fetching offers by application:', error);
        res.status(500).json({ message: 'Server error fetching offers.' });
    }
};

/**
 * Get all accepted offers for onboarding dropdown
 */
exports.getAcceptedOffers = async (req, res) => {
    try {
        const acceptedOffers = await Offer.find({ status: 'Accepted' })
            .populate('application', 'name email phone dateOfBirth')
            .select('candidateName email position application')
            .sort({ acceptedAt: -1 });
        res.status(200).json(acceptedOffers);
    } catch (error) {
        console.error('Error fetching accepted offers:', error);
        res.status(500).json({ message: 'Server error fetching accepted offers.' });
    }
};

/**
 * Generate PDF from offer letter HTML
 */
const generateOfferPDF = async (offer) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ],
        timeout: 60000
    });
    const page = await browser.newPage();

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 40px;">
            <div style="text-align:center; margin-bottom:20px;">
                <h2>Just Tap Loans</h2>
                <p><strong>Human Resources Department</strong></p>
            </div>

            <p>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
            <p>To:</p>
            <p><strong>${offer.candidateName}</strong></p>
            <p>Email: ${offer.email}</p>

            <h3 style="margin-top:20px;">Subject: Job Offer for ${offer.position}</h3>

            <p>Dear ${offer.candidateName},</p>

            <p>
                We are delighted to offer you the position of <strong>${offer.position}</strong> at <strong>Just Tap Loans</strong>.
                Your start date will be <strong>${offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'N/A'}</strong> as a <strong>${offer.employmentType}</strong> employee with an annual CTC of <strong>${offer.salary}</strong>.
            </p>

            <h4>Key Details:</h4>
            <ul>
                <li>Position: <strong>${offer.position}</strong></li>
                <li>Start Date: <strong>${offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'N/A'}</strong></li>
                <li>Employment Type: <strong>${offer.employmentType}</strong></li>
                <li>Annual CTC: <strong>${offer.salary}</strong></li>
                <li>Service Agreement: <strong>${offer.serviceAgreement}</strong></li>
                <li>Offer Expiry Date: <strong>${offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : 'N/A'}</strong></li>
            </ul>

            <h4>Benefits:</h4>
            <ul>
                ${offer.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>

            <h4>Terms & Conditions:</h4>
            <ol>
                <li>Your employment is subject to background verification and reference checks.</li>
                <li>You are required to comply with company policies and code of conduct.</li>
                <li>Early termination may involve applicable fees as per the service agreement.</li>
                <li>This offer is valid until <strong>${offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : 'N/A'}</strong>. Kindly confirm your acceptance before this date.</li>
            </ol>

            <p>We are confident that your skills and experience will be a valuable addition to our team. We look forward to welcoming you aboard!</p>

            <p>Sincerely,</p>
            <p><strong>[HR Name]</strong></p>
            <p>Human Resources Department</p>
            <p>Just Tap Loans</p>
        </div>
    `;

    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return pdfBuffer;
};

/**
 * Send offer email to candidate with PDF attachment and accept/decline buttons
 */
const sendOfferEmail = async (offer, application) => {
    const subject = `Job Offer - ${offer.position}`;
    const acceptUrl = `http://localhost:5000/api/offers/${offer._id}/accept`;
    const declineUrl = `http://localhost:5000/api/offers/${offer._id}/decline`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #1976d2; text-align: center;">Job Offer</h2>
            <p>Dear ${offer.candidateName},</p>
            <p>Congratulations! We are pleased to offer you the position of <strong>${offer.position}</strong>.</p>
            <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p><strong>Offer Details:</strong></p>
                <p>Salary: ${offer.salary}</p>
                <p>Benefits: ${offer.benefits.join(', ')}</p>
                <p>Offer Expires: ${new Date(offer.expiryDate).toLocaleDateString()}</p>
            </div>
            <p>Please review the attached offer letter and let us know your decision by the expiry date.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Accept Offer</a>
                <a href="${declineUrl}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Decline Offer</a>
            </div>
            <p>If you have any questions, please contact our HR team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the HR Portal.</p>
        </div>
    `;

    try {
        const pdfBuffer = await generateOfferPDF(offer);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: application.email,
            subject,
            html,
            attachments: [{
                filename: `Job_Offer_${offer.position}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        });
        console.log(`✅ Job offer email with PDF sent to ${application.email}`);
    } catch (error) {
        console.error('Error sending offer email:', error);
    }
};

/**
 * Accept offer
 */
exports.acceptOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found.' });
        }

        if (offer.status !== 'Pending') {
            return res.status(400).json({ message: 'Offer has already been responded to.' });
        }

        offer.status = 'Accepted';
        offer.acceptedAt = new Date();
        await offer.save();

        // Update candidate's application status
        const candidate = await Candidate.findById(offer.application);
        if (candidate) {
            const appIndex = candidate.applications.findIndex(app => app._id.toString() === offer.application.toString());
            if (appIndex !== -1) {
                candidate.applications[appIndex].status = 'Hired';
                await candidate.save();
            }
        }

        // Set user's salary on offer acceptance
        const User = require('../models/userModel');
        const user = await User.findOne({ email: offer.email });
        if (user) {
            user.salary = parseFloat(offer.salary) || 0;
            await user.save();
        }

        // Send confirmation email
        await sendOfferStatusEmail(offer, candidate, 'Accepted');

        res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #4CAF50;">Offer Accepted!</h2>
                <p>Thank you for accepting the job offer for ${offer.position}.</p>
                <p>We are excited to have you join our team!</p>
                <p>You will receive further details soon.</p>
            </div>
        `);
    } catch (error) {
        console.error('Error accepting offer:', error);
        res.status(500).json({ message: 'Server error accepting offer.' });
    }
};

/**
 * Decline offer
 */
exports.declineOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found.' });
        }

        if (offer.status !== 'Pending') {
            return res.status(400).json({ message: 'Offer has already been responded to.' });
        }

        offer.status = 'Declined';
        offer.rejectedAt = new Date();
        await offer.save();

        // Update candidate's application status
        const candidate = await Candidate.findById(offer.application);
        if (candidate) {
            const appIndex = candidate.applications.findIndex(app => app._id.toString() === offer.application.toString());
            if (appIndex !== -1) {
                candidate.applications[appIndex].status = 'Rejected';
                await candidate.save();
            }
        }

        // Send confirmation email
        await sendOfferStatusEmail(offer, candidate, 'Declined');

        res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #f44336;">Offer Declined</h2>
                <p>Thank you for your response.</p>
                <p>We wish you the best in your future endeavors.</p>
            </div>
        `);
    } catch (error) {
        console.error('Error declining offer:', error);
        res.status(500).json({ message: 'Server error declining offer.' });
    }
};

/**
 * Send offer email manually
 */
exports.sendOfferEmail = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found.' });
        }

        // For offers created without an application (like from JobOffers.js), use offer data directly
        if (!offer.application) {
            await sendOfferEmailDirect(offer);
            res.status(200).json({ message: 'Offer email sent successfully.' });
            return;
        }

        const candidate = await Candidate.findById(offer.application);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }

        await sendOfferEmail(offer, candidate);
        res.status(200).json({ message: 'Offer email sent successfully.' });
    } catch (error) {
        console.error('Error sending offer email:', error);
        res.status(500).json({ message: 'Server error sending offer email.' });
    }
};

/**
 * Send offer email directly using offer data (for offers without application)
 */
const sendOfferEmailDirect = async (offer) => {
    const subject = `Job Offer - ${offer.position}`;
    const acceptUrl = `http://localhost:5000/api/offers/${offer._id}/accept`;
    const declineUrl = `http://localhost:5000/api/offers/${offer._id}/decline`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #1976d2; text-align: center;">Job Offer</h2>
            <p>Dear ${offer.candidateName},</p>
            <p>Congratulations! We are pleased to offer you the position of <strong>${offer.position}</strong>.</p>
            <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p><strong>Offer Details:</strong></p>
                <p>Salary: ${offer.salary}</p>
                <p>Benefits: ${offer.benefits.join(', ')}</p>
                <p>Offer Expires: ${new Date(offer.expiryDate).toLocaleDateString()}</p>
            </div>
            <p>Please review the attached offer letter and let us know your decision by the expiry date.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Accept Offer</a>
                <a href="${declineUrl}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Decline Offer</a>
            </div>
            <p>If you have any questions, please contact our HR team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the HR Portal.</p>
        </div>
    `;

    try {
        const pdfBuffer = await generateOfferPDF(offer);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: offer.email,
            subject,
            html,
            attachments: [{
                filename: `Job_Offer_${offer.position}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        });
        console.log(`✅ Job offer email with PDF sent to ${offer.email}`);
    } catch (error) {
        console.error('Error sending offer email:', error);
    }
};

/**
 * Send offer status update email
 */
const sendOfferStatusEmail = async (offer, application, status) => {
    const statusMessages = {
        'Accepted': 'Congratulations! We are excited to have you join our team.',
        'Declined': 'Thank you for your interest. We wish you the best in your future endeavors.',
        'Expired': 'The offer has expired. If you are still interested, please contact us.'
    };

    const subject = `Offer Status Update - ${offer.position}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #1976d2; text-align: center;">Offer Status Update</h2>
            <p>Dear ${offer.candidateName},</p>
            <p>${statusMessages[status] || 'Your offer status has been updated.'}</p>
            <p>Position: ${offer.position}</p>
            <p>Status: ${status}</p>
            <p>If you have any questions, please contact our HR team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the HR Portal.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: application.email,
            subject,
            html
        });
        console.log(`✅ Offer status email sent to ${application.email}`);
    } catch (error) {
        console.error('Error sending offer status email:', error);
    }
};
