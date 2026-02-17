const { db, admin } = require('../config/firebase');

const createProduct = async (req, res) => {
    const { name, categoryId, price, stock, details } = req.body;
    const businessId = req.user.businessId;

    if (!name || !price || !categoryId) {
        return res.status(400).json({ message: 'Name, Price, and Category ID are required' });
    }

    try {
        const newProduct = {
            name,
            categoryId: categoryId || null,
            price: parseFloat(price),
            stock: parseInt(stock, 10) || 0,
            details: details || '',
            businessId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        };

        const docRef = await db.collection('products').add(newProduct);
        res.status(201).json({ id: docRef.id, ...newProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

const getProducts = async (req, res) => {
    const businessId = req.user.businessId;
    const { categoryId } = req.query;

    try {
        let query = db.collection('products')
            .where('businessId', '==', businessId);

        if (categoryId) {
            query = query.where('categoryId', '==', categoryId);
        }

        query = query.orderBy('createdAt', 'desc');

        const snapshot = await query.get();

        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const businessId = req.user.businessId;

    try {
        const docRef = db.collection('products').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (doc.data().businessId !== businessId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await docRef.update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const businessId = req.user.businessId;

    try {
        const docRef = db.collection('products').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (doc.data().businessId !== businessId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await docRef.delete();

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};


// Get Product By ID
const getProductById = async (req, res) => {
    const { id } = req.params;
    const businessId = req.user.businessId;

    try {
        const doc = await db.collection('products').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Ensure product belongs to the user's business
        if (doc.data().businessId !== businessId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};


// Delete Multiple Products
const deleteMultipleProducts = async (req, res) => {
    const { ids } = req.body; // Array of IDs
    const businessId = req.user.businessId;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Array of IDs is required' });
    }

    try {
        const batch = db.batch();

        const refs = ids.map(id => db.collection('products').doc(id));
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

        res.status(200).json({ message: `${deletedCount} products deleted successfully` });

    } catch (error) {
        console.error('Error deleting products:', error);
        res.status(500).json({ message: 'Error deleting products', error: error.message });
    }
};

// Get Products by Category with Pagination and Exclusion
const getProductsByCategory = async (req, res) => {
    const { categoryId, excludedIds = [], limit = 20, lastId } = req.body;
    const businessId = req.user.businessId;

    if (!categoryId) {
        return res.status(400).json({ message: 'Category ID is required' });
    }

    try {
        let query = db.collection('products')
            .where('businessId', '==', businessId)
            .where('categoryId', '==', categoryId)
            .orderBy('createdAt', 'desc');

        // Cursor-based pagination (Start After Last ID)
        if (lastId) {
            const lastDoc = await db.collection('products').doc(lastId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }

        // Fetch a bit more than limit to account for client-side filtering if needed, 
        // though excludedIds usage is limited in Firestore. 
        // We limit the query to 'limit' size.
        query = query.limit(parseInt(limit));

        const snapshot = await query.get();
        const products = [];

        snapshot.forEach(doc => {
            // Filter out if in excludedIds list (Client-side filtering on server)
            if (!excludedIds.includes(doc.id)) {
                products.push({ id: doc.id, ...doc.data() });
            }
        });

        res.status(200).json(products);

    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct, deleteMultipleProducts, getProductsByCategory };


