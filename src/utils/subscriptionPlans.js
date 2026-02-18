const SUBSCRIPTION_PLANS = {
    FREE: {
        name: 'Free',
        price: 0,
        limits: {
            products: 50,
            orders: 100, // per month
            devices: 1,
            staff: 0,
            reports: 'basic_daily' // strictly daily sales report
        },
        features: [
            'Basic receipt',
            'Daily sales report only',
            'No backups'
        ]
    },
    STARTER: {
        name: 'Starter',
        price: 19,
        limits: {
            products: 500,
            orders: Infinity,
            devices: 2,
            staff: 0,
            reports: 'basic'
        },
        features: [
            'Basic reports',
            'Inventory tracking',
            'Expenses',
            'Manual backup'
        ]
    },
    PRO: {
        name: 'Pro',
        price: 59,
        limits: {
            products: Infinity,
            orders: Infinity,
            devices: Infinity, // Implicitly unlimited on devices? The requirement says "Multi-device unlimited" for Business but Pro implies unlimited products/orders. Let's assume unlimited devices for Pro or clarify. The Business plan explicitly says "Multi-device unlimited", suggesting Pro might be limited on devices? Wait, Pro says "Bluetooth printing", "Discounts & promos". Let's stick to limits: "Unlimited orders, Unlimited products, 5 staff". Doesn't specify device limit for Pro, maybe it's still 2 or strict single store? But let's follow explicit "Multi-device unlimited" for Business. Let's assume standard usage for Pro. Ah, wait, Business says "Multi-device unlimited", implying Pro is NOT unlimited devices. Maybe Pro is single device or limited?
            // Re-reading: Pro says "Unlimited orders, Unlimited products, 5 staff accounts".
            // Business says "Multi-device unlimited".
            // Starter says "2 devices".
            // So Pro likely has a device limit > 2 but < Infinity? Or maybe just "Standard" usage?
            // Let's assume Pro allows multiple devices but Business allows unlimited.
            // Let's set a reasonable limit for Pro like 3-5 or check with user.
            // Given "Pro — Main plan", likely needs multiple devices (POS + Backoffice).
            // Actually, "Business" says "Multi-device unlimited", so Pro is limited. I'll set it to 5 devices for now as a safe bet for "Main plan" usually covering small shops with a couple tablets, matching the staff count.
            devices: 5,
            staff: 5,
            reports: 'advanced'
        },
        features: [
            'Advanced reports',
            'Profit analytics',
            'Supplier management',
            'Stock alerts',
            'Customer list',
            'Automatic backups',
            'Bluetooth printing',
            'Discounts & promos'
        ]
    },
    BUSINESS: {
        name: 'Business',
        price: 119,
        limits: {
            products: Infinity,
            orders: Infinity,
            devices: Infinity,
            staff: Infinity,
            reports: 'advanced',
            branches: 2 // 1 main + 1 sub
        },
        features: [
            'Kitchen display / order queue',
            'Role permissions',
            'Audit logs',
            'Cloud sync realtime'
        ]
    },
    ENTERPRISE: {
        name: 'Enterprise',
        price: 199,
        limits: {
            products: Infinity,
            orders: Infinity,
            devices: Infinity,
            staff: Infinity,
            reports: 'advanced',
            branches: Infinity
        },
        features: [
            'Multi-branch unlimited',
            'Central dashboard',
            'Remote monitoring',
            'Priority support',
            'Data export API',
            'White-label'
        ]
    }
};

module.exports = SUBSCRIPTION_PLANS;
