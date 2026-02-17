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
            businessIds: admin.firestore.FieldValue.arrayUnion(businessId), // Add new business directly to array
            role: 'owner',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Fetch current user data to get all businessIds for custom claims update
        // (Optimally we should trust what we just added, but let's be safe or just append to what we know)
        // Actually, custom claims has a size limit (1000 bytes). If user has MANY businesses, this might break. 
        // For now, assuming reasonable number.

        // Retrieve current claims or user doc to get full list?
        // Let's just get the user doc we just updated (or rely on logic that we know the previous state).
        // Better: Get the user doc to be sure.
        const userDoc = await db.collection('users').doc(uid).get();
        const currentBusinessIds = userDoc.data().businessIds || [businessId];

        // Update Custom Claims
        await admin.auth().setCustomUserClaims(uid, {
            role: 'owner',
            businessId: businessId, // Set as default/active
            businessIds: currentBusinessIds
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

// Get Business Profile(s) for the authenticated user
// Note: This endpoint now returns an array of businesses, similar to getAllBusinesses
const getBusinessProfile = async (req, res) => {
    const uid = req.user.uid;

    try {
        // Fetch the user document to get the latest businessIds
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = userDoc.data();
        const businessIds = userData.businessIds || [];

        if (businessIds.length === 0) {
            // Fallback: Check if there's a legacy single businessId
            if (userData.businessId) {
                const legacyDoc = await db.collection('businesses').doc(userData.businessId).get();
                if (legacyDoc.exists) {
                    return res.status(200).json([{ id: legacyDoc.id, ...legacyDoc.data() }]);
                }
            }
            return res.status(200).json([]);
        }

        const businesses = [];

        // Fetch businesses in parallel
        const businessPromises = businessIds.map(id => db.collection('businesses').doc(id).get());
        const snapshots = await Promise.all(businessPromises);

        snapshots.forEach(doc => {
            if (doc.exists) {
                businesses.push({ id: doc.id, ...doc.data() });
            }
        });

        // Sort by createdAt desc
        businesses.sort((a, b) => {
            const tA = a.createdAt ? a.createdAt.toMillis() : 0;
            const tB = b.createdAt ? b.createdAt.toMillis() : 0;
            return tB - tA;
        });

        res.status(200).json(businesses);
    } catch (error) {
        console.error('Error fetching business profiles:', error);
        res.status(500).json({ message: 'Error fetching business profiles', error: error.message });
    }
};


// Get All Businesses for the authenticated user
const getAllBusinesses = async (req, res) => {
    const uid = req.user.uid;

    try {
        // Fetch the user document to get the latest businessIds
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = userDoc.data();
        const businessIds = userData.businessIds || [];

        if (businessIds.length === 0) {
            // Fallback: Check if there's a legacy single businessId
            if (userData.businessId) {
                const legacyDoc = await db.collection('businesses').doc(userData.businessId).get();
                if (legacyDoc.exists) {
                    return res.status(200).json([{ id: legacyDoc.id, ...legacyDoc.data() }]);
                }
            }
            return res.status(200).json([]);
        }

        const businesses = [];

        // Fetch businesses in parallel
        const businessPromises = businessIds.map(id => db.collection('businesses').doc(id).get());
        const snapshots = await Promise.all(businessPromises);

        snapshots.forEach(doc => {
            if (doc.exists) {
                businesses.push({ id: doc.id, ...doc.data() });
            }
        });

        // Sort by createdAt desc
        businesses.sort((a, b) => {
            const tA = a.createdAt ? a.createdAt.toMillis() : 0;
            const tB = b.createdAt ? b.createdAt.toMillis() : 0;
            return tB - tA;
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
        // Also remove business association from user
        await db.collection('users').doc(uid).update({
            businessIds: admin.firestore.FieldValue.arrayRemove(id), // Remove specific business ID
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
            // We don't necessarily revert role to 'user' if they have other businesses.
            // Complex logic: Check if businessIds is empty?
        });

        // Refresh user doc to see if they have other businesses
        const userDoc = await db.collection('users').doc(uid).get();
        const remainingBusinessIds = userDoc.data().businessIds || [];

        const newRole = remainingBusinessIds.length > 0 ? 'owner' : 'user';
        const nextBusinessId = remainingBusinessIds.length > 0 ? remainingBusinessIds[0] : null;

        // Update Custom Claims
        await admin.auth().setCustomUserClaims(uid, {
            role: newRole,
            businessId: nextBusinessId,
            businessIds: remainingBusinessIds
        });

        res.status(200).json({ message: 'Business deleted successfully' });

    } catch (error) {
        console.error('Error deleting business:', error);
        res.status(500).json({ message: 'Error deleting business', error: error.message });
    }
};

module.exports = { createBusiness, getBusinessProfile, getAllBusinesses, getBusinessById, updateBusiness, deleteBusiness };



