const { db, admin } = require('../config/firebase');

// Helper to get consistent cart ID
const getCartId = (userId, businessId) => `${userId}_${businessId}`;

// 1. Add to Cart (or Update Quantity if exists)
const addToCart = async (req, res) => {
    const userId = req.user.uid;
    const { productId, quantity, businessId } = req.body;

    // Use businessId from body or fallback to context, but body is preferred for explicit cart actions
    let targetBusinessId = businessId || req.user.businessId;

    if (!targetBusinessId) {
        return res.status(400).json({ message: 'Business context required' });
    }

    // Validate access to business
    if (req.body.businessId) {
        const userBusinessIds = req.user.businessIds || [];
        if (!userBusinessIds.includes(targetBusinessId)) {
            return res.status(403).json({ message: 'Unauthorized access to this business context' });
        }
    }

    if (!productId || !quantity) {
        return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    const cartId = getCartId(userId, targetBusinessId);
    const cartRef = db.collection('carts').doc(cartId);

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(cartRef);

            // Fetch product details for snapshot (name, price, etc.)
            // This is optional but good for UI. For now, we assume we might need it or just store ID/Qty
            // Let's fetch product to ensure it exists and get latest price/name
            const productDoc = await t.get(db.collection('products').doc(productId));
            if (!productDoc.exists) {
                throw new Error('Product not found');
            }
            const productData = productDoc.data();

            let newItems = [];

            if (doc.exists) {
                const cartData = doc.data();
                newItems = [...(cartData.items || [])];

                const existingItemIndex = newItems.findIndex(item => item.productId === productId);

                if (existingItemIndex > -1) {
                    // Update existing item
                    newItems[existingItemIndex].quantity += parseInt(quantity);
                    // Update snapshot details in case they changed
                    newItems[existingItemIndex].productName = productData.name;
                    newItems[existingItemIndex].price = productData.price;
                } else {
                    // Add new item
                    newItems.push({
                        productId,
                        productName: productData.name,
                        price: productData.price,
                        quantity: parseInt(quantity)
                    });
                }
            } else {
                // Create new cart
                newItems = [{
                    productId,
                    productName: productData.name,
                    price: productData.price,
                    quantity: parseInt(quantity)
                }];
            }

            const payload = {
                userId,
                businessId: targetBusinessId,
                items: newItems,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            t.set(cartRef, payload);
        });

        res.status(200).json({ message: 'Cart updated successfully' });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: error.message || 'Error adding to cart' });
    }
};

// 2. Get Cart
const getCart = async (req, res) => {
    const userId = req.user.uid;

    // Explicitly check for businessId in query or header context
    let businessId = req.query.businessId || req.user.businessId;

    if (req.query.businessId) {
        const userBusinessIds = req.user.businessIds || [];
        if (!userBusinessIds.includes(businessId)) {
            return res.status(403).json({ message: 'Unauthorized access to this business context' });
        }
    }

    if (!businessId) {
        return res.status(400).json({ message: 'Business context required' });
    }

    const cartId = getCartId(userId, businessId);

    try {
        const doc = await db.collection('carts').doc(cartId).get();

        if (!doc.exists) {
            // Return empty cart structure instead of 404 for better UI handling
            return res.status(200).json({
                userId,
                businessId,
                items: []
            });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Error fetching cart' });
    }
};

// 3. Update Item Quantity
const updateCartItem = async (req, res) => {
    const userId = req.user.uid;
    const { productId } = req.params;
    const { quantity, businessId } = req.body;

    let targetBusinessId = businessId || req.user.businessId;

    // Validate access if explicit
    if (businessId) {
        const userBusinessIds = req.user.businessIds || [];
        if (!userBusinessIds.includes(businessId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
    }

    if (!targetBusinessId) return res.status(400).json({ message: 'Business context required' });
    if (!quantity || quantity < 1) return res.status(400).json({ message: 'Valid quantity required' });

    const cartId = getCartId(userId, targetBusinessId);
    const cartRef = db.collection('carts').doc(cartId);

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(cartRef);
            if (!doc.exists) throw new Error('Cart not found');

            const cartData = doc.data();
            const items = cartData.items || [];

            const itemIndex = items.findIndex(item => item.productId === productId);
            if (itemIndex === -1) throw new Error('Item not in cart');

            items[itemIndex].quantity = parseInt(quantity);

            t.update(cartRef, {
                items,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.status(200).json({ message: 'Item updated' });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: error.message });
    }
};

// 4. Remove Item
const removeCartItem = async (req, res) => {
    const userId = req.user.uid;
    const { productId } = req.params;
    // We need businessId to know WHICH cart. 
    // Usually DELETE doesn't have body, so we rely on context or query.
    // Let's support query param for DELETE.
    let businessId = req.query.businessId || req.user.businessId;

    if (req.query.businessId) {
        const userBusinessIds = req.user.businessIds || [];
        if (!userBusinessIds.includes(businessId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
    }

    if (!businessId) return res.status(400).json({ message: 'Business context required' });

    const cartId = getCartId(userId, businessId);
    const cartRef = db.collection('carts').doc(cartId);

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(cartRef);
            if (!doc.exists) throw new Error('Cart not found');

            const cartData = doc.data();
            const newItems = (cartData.items || []).filter(item => item.productId !== productId);

            t.update(cartRef, {
                items: newItems,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.status(200).json({ message: 'Item removed' });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ message: error.message });
    }
};

// 5. Clear Cart / Delete Selected
// For "Delete Selected", the client can call this with a list of IDs?
// Or we just have a "Clear Cart" and "Remove Item".
// The user request said "delete delete selected". 
// Let's implement a bulk delete endpoint (accepts list of IDs in body) or just clear all.
// I'll implement "Clear Cart" as requested in plan, but also support "Batch Remove" if body has `productIds`.
const clearCart = async (req, res) => {
    const userId = req.user.uid;
    const { productIds, businessId } = req.body; // Optional list of IDs to remove. If empty/null, clear all.

    let targetBusinessId = businessId || req.user.businessId;
    // Check access...
    if (businessId) {
        const userBusinessIds = req.user.businessIds || [];
        if (!userBusinessIds.includes(businessId)) return res.status(403).json({ message: 'Unauthorized' });
    }
    if (!targetBusinessId) return res.status(400).json({ message: 'Business context required' });

    const cartId = getCartId(userId, targetBusinessId);
    const cartRef = db.collection('carts').doc(cartId);

    try {
        if (productIds && Array.isArray(productIds) && productIds.length > 0) {
            // Remove specific items
            await db.runTransaction(async (t) => {
                const doc = await t.get(cartRef);
                if (!doc.exists) return; // Nothing to do

                const cartData = doc.data();
                const newItems = (cartData.items || []).filter(item => !productIds.includes(item.productId));

                t.update(cartRef, {
                    items: newItems,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            res.status(200).json({ message: 'Selected items removed' });
        } else {
            // Clear entire cart
            await cartRef.delete(); // Or set items: []
            res.status(200).json({ message: 'Cart cleared' });
        }
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart
};
