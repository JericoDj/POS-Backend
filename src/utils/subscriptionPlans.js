const SUBSCRIPTION_PLANS = {
    FREE: {
        name: 'Free',
        price: 0,
        limits: {
            products: 10,
            categories: 2,
            orders: 20, // per month maybe? for now total
            reports: false
        }
    },
    STARTER: {
        name: 'Starter',
        price: 29,
        limits: {
            products: 50,
            categories: 10,
            orders: 100,
            reports: true
        }
    },
    PRO: {
        name: 'Pro',
        price: 79,
        limits: {
            products: 500,
            categories: 50,
            orders: 1000,
            reports: true
        }
    },
    BUSINESS: {
        name: 'Business',
        price: 149,
        limits: {
            products: Infinity,
            categories: Infinity,
            orders: Infinity,
            reports: true
        }
    }
};

module.exports = SUBSCRIPTION_PLANS;
