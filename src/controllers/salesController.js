const { db, admin } = require('../config/firebase');

// 1. Create Sale (and update inventory)
const createSale = async (req, res) => {
    const { items, total, paymentMethod, customerId } = req.body;
    const businessId = req.user.businessId;
    const userId = req.user.uid;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Items array is required' });
    }

    try {
        const result = await db.runTransaction(async (t) => {
            // 1. Check stock for all items
            const productReads = [];
            items.forEach(item => {
                const docRef = db.collection('products').doc(item.productId);
                productReads.push(t.get(docRef));
            });

            const productDocs = await Promise.all(productReads);

            // Validate stock and business ownership
            productDocs.forEach((doc, index) => {
                if (!doc.exists) {
                    throw new Error(`Product ${items[index].productId} not found`);
                }
                const data = doc.data();
                if (data.businessId !== businessId) {
                    throw new Error(`Product ${items[index].productId} does not belong to your business`);
                }
                if (data.stock < items[index].quantity) {
                    throw new Error(`Insufficient stock for product: ${data.name}`);
                }
            });

            // 2. Deduct stock
            productDocs.forEach((doc, index) => {
                const newStock = doc.data().stock - items[index].quantity;
                t.update(doc.ref, {
                    stock: newStock,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });

            // 3. Create Sale Record
            const saleData = {
                businessId,
                userId, // Staff who made the sale
                customerId: customerId || null,
                items,
                total: parseFloat(total),
                paymentMethod: paymentMethod || 'cash',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'completed'
            };

            const saleRef = db.collection('sales').doc();
            t.set(saleRef, saleData);

            return { id: saleRef.id, ...saleData };
        });

        res.status(201).json({ message: 'Sale created successfully', sale: result });

    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    }
};

// 2. Get Sales History
const getSales = async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate, limit } = req.query;

    try {
        let query = db.collection('sales')
            .where('businessId', '==', businessId)
            .orderBy('createdAt', 'desc');

        if (startDate) {
            query = query.where('createdAt', '>=', new Date(startDate));
        }
        if (endDate) {
            query = query.where('createdAt', '<=', new Date(endDate));
        }

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const snapshot = await query.get();
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
    const businessId = req.user.businessId;

    try {
        const doc = await db.collection('sales').doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        if (doc.data().businessId !== businessId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });

    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({ message: 'Error fetching sale', error: error.message });
    }
};

module.exports = { createSale, getSales, getSaleById };
