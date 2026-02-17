const { db, admin } = require('../config/firebase');

const createCategory = async (req, res) => {
    const { name, description, color, businessId } = req.body;

    // Determine effective businessId
    let effectiveBusinessId = req.user.businessId; // Default from header/middleware

    // If businessId is provided in body, validate and use it
    if (businessId) {
        const userBusinessIds = req.user.businessIds || [];
        if (!userBusinessIds.includes(businessId)) {
            return res.status(403).json({ message: 'Unauthorized: You do not have access to the provided businessId' });
        }
        effectiveBusinessId = businessId;
    }

    if (!effectiveBusinessId) {
        return res.status(400).json({ message: 'Business context is missing. Please provide X-Business-Id header or businessId in body.' });
    }

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    try {
        const newCategory = {
            name,
            description: description || '',
            color: color || '#000000',
            businessId: effectiveBusinessId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        };

        const docRef = await db.collection('categories').add(newCategory);
        res.status(201).json({ id: docRef.id, ...newCategory });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Error creating category', error: error.message });
    }
};

const getCategories = async (req, res) => {
    let businessId = req.user.businessId;
    const queryBusinessId = req.query.businessId;

    // Allow overriding via query param if user belongs to that business
    if (queryBusinessId) {
        const userBusinessIds = req.user.businessIds || [];
        if (!userBusinessIds.includes(queryBusinessId)) {
            return res.status(403).json({ message: 'Unauthorized: You do not have access to the provided businessId' });
        }
        businessId = queryBusinessId;
    }

    if (!businessId) {
        return res.status(400).json({ message: 'Business context required' });
    }

    try {
        const snapshot = await db.collection('categories')
            .where('businessId', '==', businessId)
            // .where('status', '==', 'active') // Optional: only active categories
            .orderBy('createdAt', 'desc')
            .get();

        const categories = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};

const updateCategory = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const businessId = req.user.businessId;

    try {
        const docRef = db.collection('categories').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (doc.data().businessId !== businessId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await docRef.update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Error updating category', error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    const { id } = req.params;
    const businessId = req.user.businessId;

    try {
        const docRef = db.collection('categories').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (doc.data().businessId !== businessId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Soft delete or hard delete?
        // Let's go with soft delete by setting status to 'deleted' or just hard delete.
        // User probably expects hard delete for now.
        await docRef.delete();

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
};


// Get Category By ID
const getCategoryById = async (req, res) => {
    const { id } = req.params;
    const businessId = req.user.businessId;

    try {
        const doc = await db.collection('categories').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Ensure category belongs to the user's business
        if (doc.data().businessId !== businessId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Error fetching category', error: error.message });
    }
};


// Delete Multiple Categories
const deleteMultipleCategories = async (req, res) => {
    const { ids } = req.body; // Array of IDs
    const businessId = req.user.businessId;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Array of IDs is required' });
    }

    try {
        const batch = db.batch();

        // We need to verify ownership for EACH doc, or trust the query.
        // A more efficient way is to query all these docs and verify businessId.
        // However, standard "in" query limits to 10 or 30 items.
        // For simplicity in a "delete multiple" request, we can just try to delete them 
        // IF they belong to the business.

        // 1. Fetch all docs to verify ownership
        // Optimization: Use getAll or similar if supported, or loop.
        // Firestore refs.
        const refs = ids.map(id => db.collection('categories').doc(id));
        const snapshots = await db.getAll(...refs);

        let deletedCount = 0;

        snapshots.forEach(doc => {
            if (doc.exists && doc.data().businessId === businessId) {
                batch.delete(doc.ref);
                deletedCount++;
            }
        });

        if (deletedCount > 0) {
            await batch.commit();
        }

        res.status(200).json({ message: `${deletedCount} categories deleted successfully` });

    } catch (error) {
        console.error('Error deleting categories:', error);
        res.status(500).json({ message: 'Error deleting categories', error: error.message });
    }
};

module.exports = { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory, deleteMultipleCategories };


