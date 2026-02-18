const express = require('express');
const router = express.Router();
const { updateUserSubscription, updateSubscription, unsubscribeUser } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/subscription-id', verifyToken, updateUserSubscription); // Renamed to avoid conflict, or keep as legacy
router.post('/subscription', verifyToken, updateSubscription); // New full update
router.post('/unsubscribe', verifyToken, unsubscribeUser); // Explicit unsubscribe

module.exports = router;
