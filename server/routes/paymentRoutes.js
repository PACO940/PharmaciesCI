/**
 * Routes de paiement et abonnements
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Validation rules
const checkoutValidation = [
  body('priceId')
    .notEmpty()
    .withMessage('ID du prix requis')
];

// Routes publiques
router.get('/plans', paymentController.getPlans);

// Webhook Stripe (doit être avant les routes protégées)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Routes protégées
router.use(protect);
router.post('/create-checkout-session', checkoutValidation, paymentController.createCheckoutSession);
router.get('/subscription-status', paymentController.getSubscriptionStatus);
router.post('/cancel-subscription', paymentController.cancelSubscription);

module.exports = router;
