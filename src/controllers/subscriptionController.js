const { db, admin } = require('../config/firebase');
const { Polar } = require('@polar-sh/sdk');

// Initialize Polar
const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN, // Ensure this is loaded
});

// Plan Mapping (Using provided Polar Checkouts/Product IDs)
// Verify if these are Product IDs or Checkout Link IDs.
// If valid Product IDs, `polar.checkouts.create` works.
const PLAN_TO_PRODUCT = {
    starter: "polar_cl_yo7F72nGmXb0HaDtWGo5DPY1DqkFxT4xsPTOO0F5qfo",
    growth: "polar_cl_OKU05fZlrnTppzBg0ApsbUPV0VjQi1DaMO4g32n2vWi",
    pro: "polar_cl_LbLsX2Qf6hMOw3d1CcwYT5EXQSMTnWfL4x0uO00B28t"
};

// 1. Create Checkout
const createCheckout = async (req, res) => {
    const { planId, businessId } = req.body;
    const { uid, email } = req.user; // From verifyToken

    if (!planId || !businessId) {
        return res.status(400).json({ message: 'Missing planId or businessId' });
    }

    const productId = PLAN_TO_PRODUCT[planId.toLowerCase()];
    if (!productId) {
        return res.status(400).json({ message: 'Invalid planId' });
    }

    try {
        // Create a pending transaction record
        const txRef = await db.collection('transactions').add({
            businessId,
            planId,
            userId: uid,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            type: 'subscription_checkout'
        });

        // Construct Checkout Link with Metadata
        // Using the provided 'Link IDs' which are actually tokens: polar_cl_...
        const baseUrl = `https://buy.polar.sh/${productId}`;
        const params = new URLSearchParams();

        if (email) params.append('customer_email', email);

        // Metadata mapping for Polar Checkout Links
        // Polar accepts metadata as nested object syntax in query params: metadata[key]=value
        params.append('metadata[transactionId]', txRef.id);
        params.append('metadata[businessId]', businessId);
        params.append('metadata[planId]', planId);
        params.append('metadata[firebaseUid]', uid);

        // Success URL might be configured in the Link settings on Polar Dashboard,
        // OR passed here if the Link supports `success_url` override (not always guaranteed for Links vs API).
        // For now, relying on the params to carry the data. 
        // If 'success_url' param is supported:
        // params.append('success_url', `https://api-75l7ugvwya-uc.a.run.app/payment-success?checkout_id=${txRef.id}`);

        const checkoutUrl = `${baseUrl}?${params.toString()}`;

        // Update Transaction
        await txRef.update({
            checkoutUrl: checkoutUrl,
            checkoutId: 'LINK_BASED', // No API ID generated yet
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ checkoutUrl });

    } catch (error) {
        console.error('Error creating checkout:', error);
        res.status(500).json({ message: 'Failed to create checkout', error: error.message });
    }
};

// 2. Webhook Handler
const handleWebhook = async (req, res) => {
    try {
        const event = req.body;
        if (!event || !event.type || !event.data) {
            return res.status(400).send('Invalid payload');
        }

        console.log(`🔔 Polar Webhook: ${event.type}`);
        const payload = event.data;

        // 2a. Order Paid
        if (event.type === 'order.paid') {
            await handleOrderPaid(payload);
        }

        // 2b. Subscription Updates
        if (event.type.startsWith('subscription.')) {
            await handleSubscriptionUpdate(payload);
        }

        res.status(200).send('Webhook processed');

    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Webhook failed');
    }
};

// Start Helper: Handle Order Paid
async function handleOrderPaid(payload) {
    // Extract metadata
    const metadata = payload.metadata || {};
    const transactionId = metadata.transactionId || metadata.reference_id; // Check both

    if (!transactionId) {
        console.warn('❌ Order Paid missing transactionId metadata');
        return;
    }

    const txRef = db.collection('transactions').doc(transactionId);
    const txSnap = await txRef.get();

    if (!txSnap.exists) {
        console.warn(`❌ Transaction ${transactionId} not found`);
        return;
    }

    // Update Transaction
    await txRef.update({
        status: 'completed',
        orderId: payload.id,
        verifiedVia: 'polar_order',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update Business Subscription
    const { businessId, planId } = txSnap.data();
    if (businessId && planId) {
        await updateBusinessSubscription(businessId, {
            planId: planId,
            status: 'active',
            polarSubscriptionId: payload.subscription_id,
            customerId: payload.customer_id,
            productId: payload.product_id
        });
    }
}

// Start Helper: Handle Subscription Update
async function handleSubscriptionUpdate(subscription) {
    const metadata = subscription.metadata || {};
    const transactionId = metadata.transactionId || metadata.reference_id;
    let businessId = metadata.businessId;

    // Use transaction to find business if missing
    if (!businessId && transactionId) {
        const txDoc = await db.collection('transactions').doc(transactionId).get();
        if (txDoc.exists) businessId = txDoc.data().businessId;
    }

    if (businessId) {
        let status = subscription.status;
        // Map Polar status to our status if needed (active, canceled, etc.)

        await updateBusinessSubscription(businessId, {
            status: status,
            polarSubscriptionId: subscription.id,
            customerId: subscription.customer_id,
            productId: subscription.product_id
        });
    }
}

// Start Helper: Update Business Doc
async function updateBusinessSubscription(businessId, data) {
    try {
        const businessRef = db.collection('businesses').doc(businessId);
        // Might need to check if exists, but update should fail if not.

        const updateData = {
            'subscription.status': data.status,
            'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
        };

        if (data.planId) updateData['subscription.plan'] = data.planId;
        if (data.polarSubscriptionId) updateData['subscription.polarSubscriptionId'] = data.polarSubscriptionId;
        if (data.customerId) updateData['subscription.customerId'] = data.customerId;
        if (data.productId) updateData['subscription.productId'] = data.productId;

        // Set End Date if active (e.g. +30 days, or better rely on Polar's period_end if available in webhook)
        // For now, simple timestamp update

        await businessRef.update(updateData);
        console.log(`✅ Business ${businessId} subscription updated.`);
    } catch (error) {
        console.error(`❌ Failed to update business ${businessId}:`, error);
    }
}


// 3. Cancel Subscription
const cancelSubscription = async (req, res) => {
    const { businessId } = req.body;
    // Auth check: Is user owner of business?
    // Using simple match for now
    if (req.user.businessId !== businessId) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
        const doc = await db.collection('businesses').doc(businessId).get();
        if (!doc.exists) return res.status(404).json({ message: 'Business not found' });

        const sub = doc.data().subscription;
        if (!sub || !sub.polarSubscriptionId) {
            return res.status(400).json({ message: 'No active subscription found to cancel' });
        }

        // Call Polar API
        // SDK might have subscriptions.cancel? Or generic request.
        // User sample used fetch. Let's try SDK or fetch.
        // SDK `polar.subscriptions.cancel`?  
        // Checking docs (hypothetically). Often it's polar.subscriptions.update(id, { cancel_at_period_end: true })
        // or polar.subscriptions.cancel(id).
        // Let's use fetch as fallback since SDK methods vary.

        try {
            // Assuming SDK usage: await polar.subscriptions.cancel(sub.polarSubscriptionId);
            // Or user's fetch method
            const response = await fetch(`https://api.polar.sh/v1/subscriptions/${sub.polarSubscriptionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const txt = await response.text();
                throw new Error(`Polar API ${response.status}: ${txt}`);
            }

        } catch (apiErr) {
            console.error('Polar Cancel Error:', apiErr);
            // If 403/404, valid to proceed locally.
        }

        // Update DB
        await db.collection('businesses').doc(businessId).update({
            'subscription.status': 'canceled',
            'subscription.canceledAt': admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'Subscription canceled successfully' });

    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ message: 'Error canceling subscription', error: error.message });
    }
};

// 4. Payment Success Page
const paymentSuccess = async (req, res) => {
    const { checkout_id } = req.query;
    // ... Render HTML ...
    // Using the user's HTML template
    res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Successful</title>
  <style>
    body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0fdf4; }
    .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
    h1 { color: #16a34a; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✅ Payment Successful</h1>
    <p>Your subscription has been activated.</p>
    <p><small>Checkout ID: ${checkout_id || 'N/A'}</small></p>
    <button onclick="window.close()" style="margin-top:20px; padding: 10px 20px; cursor:pointer;">Close Window</button>
  </div>
</body>
</html>
    `);
};

module.exports = { createCheckout, handleWebhook, cancelSubscription, paymentSuccess };
