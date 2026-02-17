const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct, deleteMultipleProducts, getProductsByCategory } = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkSubscriptionLimit } = require('../middleware/subscriptionMiddleware');

router.use(verifyToken);
// Create Product
router.post('/', checkSubscriptionLimit('products'), createProduct);

// Get Products by Category(Optimized)
router.post('/category', getProductsByCategory);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/bulk-delete', deleteMultipleProducts);
router.delete('/:id', deleteProduct);

module.exports = router;
