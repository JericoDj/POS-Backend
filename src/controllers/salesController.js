const { db, admin } = require('../config/firebase');

// 1. Create Sale (and update inventory)
const createSale = async (req, res) => {
    // 1. Determine effective Business ID
    let businessId = req.user.businessId;
    const bodyBusinessId = req.body.businessId;

    if (bodyBusinessId) {
        const userBusinessIds = req.user.businessIds || [];
        if (!userBusinessIds.includes(bodyBusinessId)) {
            return res.status(403).json({ message: 'Unauthorized: You do not have access to the provided businessId' });
        }
        businessId = bodyBusinessId;
    }

    if (!businessId) {
        return res.status(400).json({ message: 'Business context required' });
    }

    const { items, total, paymentMethod, customerId } = req.body;
    const userId = req.user.uid;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Items array is required' });
    }

    try {
        // --- Step 1: Fetch all products first (Parallel Read) ---
        const productRefs = items.map(item => db.collection('products').doc(item.productId));
        const productDocs = await db.getAll(...productRefs);

        const batch = db.batch(); // Use batch for atomic writes (all or nothing)

        // --- Step 2: Validate Stock & Ownership ---
        for (let i = 0; i < productDocs.length; i++) {
            const doc = productDocs[i];
            const item = items[i];

            if (!doc.exists) {
                return res.status(404).json({ message: `Product ${item.productId} not found` });
            }

            const data = doc.data();

            // Check Business Ownership
            if (data.businessId !== businessId) {
                return res.status(403).json({
                    message: `Product ${item.productId} (${data.name}) does not belong to the current business context (${businessId})`
                });
            }

            // Check Stock
            if (data.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for product: ${data.name}. Available: ${data.stock}, Requested: ${item.quantity}`
                });
            }

            // item.productName = data.name; // Optional: Store snapshot of name?

            // Prepare Stock Update in Batch
            const newStock = data.stock - item.quantity;
            batch.update(doc.ref, {
                stock: newStock,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        // --- Step 3: Create Sale Record ---
        const saleData = {
            businessId,
            userId,
            customerId: customerId || null,
            items,
            total: parseFloat(total),
            paymentMethod: paymentMethod || 'cash',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        };

        const saleRef = db.collection('sales').doc();
        batch.set(saleRef, saleData);

        // --- Step 4: Commit Batch ---
        await batch.commit();

        res.status(201).json({ message: 'Sale created successfully', sale: { id: saleRef.id, ...saleData } });

    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ message: 'Error processing sale', error: error.message });
    }
};

// 2. Get Sales History
const getSales = async (req, res) => {
    // 1. Get Effective Business ID
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

    const { startDate, endDate, limit } = req.query;

    try {
        // Standard Query: Fetch recent sales for this business
        let query = db.collection('sales')
            .where('businessId', '==', businessId)
            .orderBy('createdAt', 'desc');

        // Optional Filters
        if (startDate && endDate) {
            query = query.where('createdAt', '>=', new Date(startDate))
                .where('createdAt', '<=', new Date(endDate));
        }

        // Default limit if not provided
        const queryLimit = limit ? parseInt(limit) : 50;

        const snapshot = await query.limit(queryLimit).get();

        const sales = [];
        snapshot.forEach(doc => {
            sales.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(sales);

    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ message: 'Error fetching sales', error: error.message });
    }
};

// 3. Get Single Sale
const getSaleById = async (req, res) => {
    const { id } = req.params;
    const businessId = req.user.businessId; // Can be enhanced to support query param too if needed, but usually ID is enough if we validate ownership

    try {
        const doc = await db.collection('sales').doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Validate Validation: Check if user has access to this sale's business
        const saleBusinessId = doc.data().businessId;
        const userBusinessIds = req.user.businessIds || [];

        // Use more robust check: does user belong to the sale's business?
        if (!userBusinessIds.includes(saleBusinessId)) {
            return res.status(403).json({ message: 'Unauthorized access to this sale' });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });

    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({ message: 'Error fetching sale', error: error.message });
    }
};

// 4. Update Sale (Metadata only)
const updateSale = async (req, res) => {
    const { id } = req.params;
    const { paymentMethod, status, total } = req.body;

    try {
        const docRef = db.collection('sales').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Validate Access
        const saleBusinessId = doc.data().businessId;
        const userBusinessIds = req.user.businessIds || [];
        if (!userBusinessIds.includes(saleBusinessId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const updates = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (paymentMethod) updates.paymentMethod = paymentMethod;
        if (status) updates.status = status;
        if (total) updates.total = parseFloat(total); // Be careful allowing total update without re-calc items

        await docRef.update(updates);

        res.status(200).json({ message: 'Sale updated successfully' });
    } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ message: 'Error updating sale', error: error.message });
    }
};

// 5. Delete Sale (Hard Delete)
const deleteSale = async (req, res) => {
    const { id } = req.params;

    try {
        const docRef = db.collection('sales').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Validate Access
        const saleBusinessId = doc.data().businessId;
        const userBusinessIds = req.user.businessIds || [];
        if (!userBusinessIds.includes(saleBusinessId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await docRef.delete();

        res.status(200).json({ message: 'Sale deleted successfully' });
    } catch (error) {
        console.error('Error deleting sale:', error);
        res.status(500).json({ message: 'Error deleting sale', error: error.message });
    }
};

module.exports = { createSale, getSales, getSaleById, updateSale, deleteSale };
