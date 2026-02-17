const express = require('express');
const router = express.Router();
const { addToCart, getCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', addToCart);
router.get('/', getCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeCartItem);
router.delete('/', clearCart); // Handles clear all or delete selected (via body)

module.exports = router;
