const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct, deleteMultipleProducts } = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkSubscriptionLimit } = require('../middleware/subscriptionMiddleware');

router.use(verifyToken);

router.post('/', checkSubscriptionLimit('products'), createProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/bulk-delete', deleteMultipleProducts);
router.delete('/:id', deleteProduct);

module.exports = router;
