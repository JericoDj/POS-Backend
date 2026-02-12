const express = require('express');
const router = express.Router();
const { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory, deleteMultipleCategories } = require('../controllers/categoryController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware import fix: it is in src/middleware/subscriptionMiddleware.js
// So correct path is '../middleware/subscriptionMiddleware'

router.post('/', verifyToken, createCategory);
router.get('/', verifyToken, getCategories);
router.get('/:id', verifyToken, getCategoryById);
router.put('/:id', verifyToken, updateCategory);
router.delete('/bulk-delete', verifyToken, deleteMultipleCategories);
router.delete('/:id', verifyToken, deleteCategory);

module.exports = router;
