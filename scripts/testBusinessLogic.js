const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const TEST_USER = {
    email: `biz_user_${Date.now()}@example.com`,
    password: 'Password123!',
    displayName: 'Biz User'
};

const runTests = async () => {
    console.log('🧪 Starting Business Logic Tests...\n');

    let token = null;
    let userId = null;
    let businessId = null;
    let categoryId = null;
    let productId = null;
    let saleId = null;

    // 1. Authenticate (Register)
    try {
        console.log('1. Registering User...');
        const res = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
        userId = res.data.user.uid;
        console.log('✅ Registered:', userId);

        // Wait a bit for Firestore propagation
        await new Promise(r => setTimeout(r, 1000));

        // Login to get ID Token with custom claims (if any)
        // NOTE: In our implementation, register sends back user data but NOT a token.
        // We need to login to get the token.
        console.log('   Logging in to get token...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        token = loginRes.data.idToken;
        console.log('✅ Logged In. Token received.');

    } catch (error) {
        console.error('❌ Auth Failed:', error.response?.data || error.message);
        process.exit(1);
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create Business
    try {
        console.log('\n2. Creating Business...');
        const res = await axios.post(`${BASE_URL}/business`, {
            name: 'Test Cafe',
            type: 'Retail'
        }, { headers });
        businessId = res.data.businessId;
        console.log('✅ Business Created:', businessId);
        console.log('   Note:', res.data.note);

        // RE-LOGIN to get updated custom claims (businessId)
        console.log('   Re-logging in to refresh claims...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        token = loginRes.data.idToken;
        headers.Authorization = `Bearer ${token}`; // Update headers
        console.log('✅ Token Refreshed with BusinessID claim.');

    } catch (error) {
        console.error('❌ Create Business Failed:', error.response?.data || error.message);
        process.exit(1);
    }

    // 3. Create Category
    try {
        console.log('\n3. Creating Category...');
        const res = await axios.post(`${BASE_URL}/categories`, {
            name: 'Beverages',
            color: '#FF0000'
        }, { headers });
        categoryId = res.data.id;
        console.log('✅ Category Created:', categoryId);
    } catch (error) {
        console.error('❌ Create Category Failed:', error.response?.data || error.message);
    }

    // 4. Create Product
    try {
        console.log('\n4. Creating Product...');
        const res = await axios.post(`${BASE_URL}/products`, {
            name: 'Latte',
            price: 5.00,
            stock: 100,
            categoryId
        }, { headers });
        productId = res.data.id;
        console.log('✅ Product Created:', productId, '(Stock: 100)');
    } catch (error) {
        console.error('❌ Create Product Failed:', error.response?.data || error.message);
    }

    // 5. Create Sale
    try {
        console.log('\n5. Creating Sale...');
        const res = await axios.post(`${BASE_URL}/sales`, {
            items: [
                { productId, quantity: 2, price: 5.00 }
            ],
            total: 10.00,
            paymentMethod: 'cash'
        }, { headers });
        saleId = res.data.sale.id;
        console.log('✅ Sale Created:', saleId);
    } catch (error) {
        console.error('❌ Create Sale Failed:', error.response?.data || error.message);
    }

    // 6. Verify Stock Update
    try {
        console.log('\n6. Verifying Inventory Deduction...');
        const res = await axios.get(`${BASE_URL}/products`, { headers });
        const product = res.data.find(p => p.id === productId);
        if (product.stock === 98) {
            console.log('✅ Inventory Verified: Stock dropped from 100 to 98.');
        } else {
            console.error('❌ Inventory Failed: Expected 98, got', product.stock);
        }
    } catch (error) {
        console.error('❌ Verify Inventory Failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Business Logic Tests Completed.');
};

runTests();
