const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');

// Offer routes
router.get('/', offerController.getAllOffers);
router.get('/:id', offerController.getOfferById);
router.post('/', offerController.createOffer);
router.put('/:id', offerController.updateOffer);
router.delete('/:id', offerController.deleteOffer);

// Get offers by application
router.get('/application/:applicationId', offerController.getOffersByApplication);

// Get accepted offers for onboarding
router.get('/accepted/list', offerController.getAcceptedOffers);

// Accept/Decline offer routes
router.get('/:id/accept', offerController.acceptOffer);
router.get('/:id/decline', offerController.declineOffer);

// Send offer email manually
router.post('/:id/send-email', offerController.sendOfferEmail);

module.exports = router;
