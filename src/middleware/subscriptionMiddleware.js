const { db } = require('../config/firebase');
const SUBSCRIPTION_PLANS = require('../utils/subscriptionPlans');

const checkSubscriptionLimit = (resource) => {
    return async (req, res, next) => {
        const businessId = req.user.businessId;

        if (!businessId) {
            return res.status(403).json({ message: 'No business associated with user' });
        }

        try {
            const businessDoc = await db.collection('businesses').doc(businessId).get();
            const business = businessDoc.data();
            const planName = business.subscription?.plan || 'BASIC';
            const plan = SUBSCRIPTION_PLANS[planName];

            if (!plan) {
                // Should not happen if data integrity is kept
                return next();
            }

            const limit = plan.limits[resource];

            // If limit is boolean (e.g. reports: false/true)
            if (typeof limit === 'boolean') {
                if (!limit) {
                    return res.status(403).json({ message: `Access to ${resource} is not allowed on ${planName} plan.` });
                }
                return next();
            }

            // If limit is quantity
            if (limit === Infinity) {
                return next();
            }

            // Count current usage
            // This might be expensive for large collections (e.g. aggregating counts).
            // Optimization: Store counts in the business document or a separate metadata document.
            // For now, allow direct count for simplicity but add a TODO.
            const snapshot = await db.collection(resource)
                .where('businessId', '==', businessId)
                .count()
                .get();

            const currentCount = snapshot.data().count;

            if (currentCount >= limit) {
                return res.status(403).json({
                    message: `${planName} plan limit reached for ${resource}. Limit is ${limit}.`,
                    currentUsage: currentCount,
                    limit: limit
                });
            }

            next();
        } catch (error) {
            console.error('Error checking subscription limit:', error);
            res.status(500).json({ message: 'Error verifying subscription limits' });
        }
    };
};

module.exports = { checkSubscriptionLimit };
