const { db, admin } = require('../config/firebase');

// Update User Subscription ID
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

        res.status(200).json({ message: 'User subscription updated successfully' });

    } catch (error) {
        console.error('Error updating user subscription:', error);
        res.status(500).json({ message: 'Error updating user subscription', error: error.message });
    }
};

module.exports = { updateUserSubscription };
