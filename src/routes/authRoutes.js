const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, getMe, updateUser, deleteAccount } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// Protected Routes
router.get('/me', verifyToken, getMe);
router.put('/update', verifyToken, updateUser);
router.delete('/delete', verifyToken, deleteAccount);

module.exports = router;
