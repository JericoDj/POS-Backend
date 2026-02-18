const express = require('express');
const router = express.Router();
const { updateUserSubscription } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/subscription', verifyToken, updateUserSubscription);

module.exports = router;
