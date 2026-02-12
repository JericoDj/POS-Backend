const express = require('express');
const router = express.Router();
const { createBusiness, getBusinessProfile, getAllBusinesses, getBusinessById, updateBusiness, deleteBusiness } = require('../controllers/businessController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createBusiness);
router.get('/profile', verifyToken, getBusinessProfile);

// Generic Read Routes (Maybe limit to Admin? For now verifyToken)
router.get('/', verifyToken, getAllBusinesses);
router.get('/:id', verifyToken, getBusinessById);
router.put('/:id', verifyToken, updateBusiness);
router.delete('/:id', verifyToken, deleteBusiness);


module.exports = router;
