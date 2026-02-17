const express = require('express');
const router = express.Router();
const { createSale, getSales, getSaleById, updateSale, deleteSale } = require('../controllers/salesController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes are protected
router.use(verifyToken);

router.post('/', createSale);
router.get('/', getSales);
router.get('/:id', getSaleById);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

module.exports = router;
