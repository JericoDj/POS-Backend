const express = require('express');
const router = express.Router();
const { createCheckout, handleWebhook, cancelSubscription, paymentSuccess } = require('../controllers/subscriptionController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protected Routes
router.post('/create-checkout', verifyToken, createCheckout);
router.post('/cancel-subscription', verifyToken, cancelSubscription);

// Public Routes (Webhooks & Success Page)
// Note: Webhook might need raw body if verified, but user used json.
router.post('/webhook', handleWebhook);
router.get('/payment-success', paymentSuccess); // Browser visited

module.exports = router;
