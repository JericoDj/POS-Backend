const { db, admin } = require('../config/firebase');

const createBusiness = async (req, res) => {
    const { name, address, contact, type } = req.body;
    const uid = req.user.uid;

    if (!name) {
        return res.status(400).json({ message: 'Business name is required' });
    }

    try {
        const businessData = {
            name,
            address: address || '',
            contact: contact || '',
            type: type || 'retail',
            ownerId: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            settings: {
                currency: 'USD',
                timezone: 'UTC'
            }
        };

        // Create Business Document
        const businessRef = await db.collection('businesses').add(businessData);
        const businessId = businessRef.id;

        // Update User with businessId and owner role
        await db.collection('users').doc(uid).update({
            businessId: businessId,
            role: 'owner',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update Custom Claims
        await admin.auth().setCustomUserClaims(uid, {
            role: 'owner',
            businessId: businessId // This is crucial for tenancy isolation
        });

        // We might need to refresh the token on the client side to get the new claims
        res.status(201).json({
            message: 'Business created successfully',
            businessId: businessId,
            business: businessData,
            note: 'Please refresh the ID token on the client to get the new permissions.'
        });

    } catch (error) {
        console.error('Error creating business:', error);
        res.status(500).json({ message: 'Error creating business', error: error.message });
    }
};

const getBusinessProfile = async (req, res) => {
    // businessId is attached to req.user (if we trust the token claim) or we can look it up in Firestore
    // Ideally, use the token claim for tenancy isolation.
    // However, immediately after creation, the token might be stale.
    // For a robust implementation, middleware should have verified the token.

    // If the token is stale (e.g. just created business), req.user.businessId might be undefined.
    // In that case, we can check the user doc in Firestore, but that's an extra read.

    let businessId = req.user.businessId;

    if (!businessId) {
        // Fallback: Check Firestore user doc
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        businessId = userDoc.data()?.businessId;
    }

    if (!businessId) {
        return res.status(404).json({ message: 'No business associated with this user' });
    }

    try {
        const doc = await db.collection('businesses').doc(businessId).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Business not found' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error fetching business:', error);
        res.status(500).json({ message: 'Error fetching business', error: error.message });
    }
};


// Get All Businesses (Admin or Directory listing)
const getAllBusinesses = async (req, res) => {
    try {
        const snapshot = await db.collection('businesses')
            .orderBy('createdAt', 'desc')
            .get();

        const businesses = [];
        snapshot.forEach(doc => {
            businesses.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(businesses);
    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json({ message: 'Error fetching businesses', error: error.message });
    }
};

// Get Business By ID
const getBusinessById = async (req, res) => {
    const { id } = req.params;

    try {
        const doc = await db.collection('businesses').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Business not found' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error fetching business:', error);
        res.status(500).json({ message: 'Error fetching business', error: error.message });
    }
};


// Update Business
const updateBusiness = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const uid = req.user.uid;
    const { role, businessId } = req.user;

    try {
        // Verify ownership or admin status
        // If the user's businessId matches the requested ID, and they are 'owner', allow it.
        // OR if we strictly follow that a user can only edit their own business info:

        if (businessId !== id || role !== 'owner') {
            return res.status(403).json({ message: 'Unauthorized. Only the owner can update business settings.' });
        }

        const docRef = db.collection('businesses').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Business not found' });
        }

        await docRef.update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'Business updated successfully' });

    } catch (error) {
        console.error('Error updating business:', error);
        res.status(500).json({ message: 'Error updating business', error: error.message });
    }
};


// Delete Business (Soft delete or Hard delete?)
// For now, let's do a "soft delete" by setting status to 'deleted', 
// or strictly hard delete if requested. User said "DELETE BUSINESS", usually implies removal.
// However, deleting a business should probably delete all sub-collections (products, categories, sales).
// Firestore doesn't do recursive delete automatically on client/admin SDK without specific tools.
// For now, let's just delete the business doc and maybe update the user.
const deleteBusiness = async (req, res) => {
    const { id } = req.params;
    const { uid, role, businessId } = req.user;

    try {
        if (businessId !== id || role !== 'owner') {
            return res.status(403).json({ message: 'Unauthorized. Only the owner can delete the business.' });
        }

        const docRef = db.collection('businesses').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Business not found' });
        }

        // Optional: Recursive delete of sub-collections or related docs (categories, products)
        // For safely, let's just mark as deleted or delete the main doc.
        // Let's doing hard delete of the document for now as per specific CRUD request.
        await docRef.delete();

        // Also remove business association from user?
        await db.collection('users').doc(uid).update({
            businessId: admin.firestore.FieldValue.delete(),
            role: 'user', // revert to simple user
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update Custom Claims to remove businessId
        await admin.auth().setCustomUserClaims(uid, {
            role: 'user'
        });

        res.status(200).json({ message: 'Business deleted successfully' });

    } catch (error) {
        console.error('Error deleting business:', error);
        res.status(500).json({ message: 'Error deleting business', error: error.message });
    }
};

module.exports = { createBusiness, getBusinessProfile, getAllBusinesses, getBusinessById, updateBusiness, deleteBusiness };



