const SUBSCRIPTION_PLANS = {
    BASIC: {
        name: 'Basic',
        price: 0,
        limits: {
            products: 50,
            categories: 10,
            orders: 100, // per month maybe? for now total
            reports: false
        }
    },
    PRO: {
        name: 'Pro',
        price: 29,
        limits: {
            products: 500,
            categories: 50,
            orders: 1000,
            reports: true
        }
    },
    ENTERPRISE: {
        name: 'Enterprise',
        price: 99,
        limits: {
            products: Infinity,
            categories: Infinity,
            orders: Infinity,
            reports: true
        }
    }
};

module.exports = SUBSCRIPTION_PLANS;
