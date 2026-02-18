const { db, admin } = require('../config/firebase');

// Update User Subscription ID (Legacy/Simple)
const updateUserSubscription = async (req, res) => {
    const uid = req.user.uid;
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
        return res.status(400).json({ message: 'Missing subscriptionId' });
    }

    try {
        await db.collection('users').doc(uid).update({
            subscriptionId: subscriptionId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'User subscription ID updated successfully' });

    } catch (error) {
        console.error('Error updating user subscription:', error);
        res.status(500).json({ message: 'Error updating user subscription', error: error.message });
    }
};

// Update User Subscription (Full Object - Subscribe/Unsubscribe)
const updateSubscription = async (req, res) => {
    const uid = req.user.uid;
    const subscriptionData = req.body;

    if (!subscriptionData || !subscriptionData.status) {
        return res.status(400).json({ message: 'Invalid subscription data' });
    }

    try {
        await db.collection('users').doc(uid).update({
            subscription: subscriptionData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'User subscription updated successfully' });

    } catch (error) {
        console.error('Error updating user subscription:', error);
        res.status(500).json({ message: 'Error updating user subscription', error: error.message });
    }
};

// Unsubscribe User (Explicit Action)
const unsubscribeUser = async (req, res) => {
    const uid = req.user.uid;
    // Optional: verification if they are unsubscribing a specific subscription ID
    // const { subscriptionId } = req.body; 

    try {
        // Fetch current to check if exists or already canceled? (Optional optimization)

        await db.collection('users').doc(uid).update({
            'subscription.status': 'canceled',
            'subscription.canceledAt': admin.firestore.FieldValue.serverTimestamp(),
            'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'User unsubscribed successfully' });

    } catch (error) {
        console.error('Error unsubscribing user:', error);
        res.status(500).json({ message: 'Error unsubscribing user', error: error.message });
    }
};

module.exports = { updateUserSubscription, updateSubscription, unsubscribeUser };
