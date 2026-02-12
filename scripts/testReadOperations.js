const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const TEST_USER = {
    email: 'biz_user_test_read@example.com',
    password: 'Password123!',
    displayName: 'Biz User Read Test'
};

const runTests = async () => {
    console.log('🧪 Starting Enhanced Read Operations Tests...\n');

    let token = null;
    let userId = null;
    let businessId = null;
    let categoryId = null;
    let productId = null;

    // 1. Setup Data (Register -> Business -> Category -> Product)
    try {
        console.log('1. Setting up test data...');

        // Register
        try {
            await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
        } catch (e) {
            // Ignore if already exists, just login
        }

        // Login
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        token = loginRes.data.idToken;
        const headers = { Authorization: `Bearer ${token}` };

        // Create Business
        const bizRes = await axios.post(`${BASE_URL}/business`, { name: 'ReadTest Biz' }, { headers });
        businessId = bizRes.data.businessId;

        // Re-login for claims
        const loginRes2 = await axios.post(`${BASE_URL}/auth/login`, { email: TEST_USER.email, password: TEST_USER.password });
        token = loginRes2.data.idToken;
        headers.Authorization = `Bearer ${token}`;

        // Create Category
        const catRes = await axios.post(`${BASE_URL}/categories`, { name: 'ReadTest Cat' }, { headers });
        categoryId = catRes.data.id;

        // Create Product
        const prodRes = await axios.post(`${BASE_URL}/products`, {
            name: 'ReadTest Prod',
            price: 10,
            categoryId: categoryId
        }, { headers });
        productId = prodRes.data.id;

        console.log('✅ Setup Complete. Business:', businessId, 'Category:', categoryId, 'Product:', productId);

        // 2. Test Business Read Ops
        console.log('\n2. Testing Business Read Operations...');

        // Get All Businesses
        const allBizRes = await axios.get(`${BASE_URL}/business`, { headers });
        console.log(`   GET /business: Found ${allBizRes.data.length} businesses.`);

        // Get Specific Business
        const specBizRes = await axios.get(`${BASE_URL}/business/${businessId}`, { headers });
        if (specBizRes.data.id === businessId) {
            console.log('✅ GET /business/:id: Success');
        } else {
            console.error('❌ GET /business/:id: ID mismatch');
        }

        // 3. Test Category Read Ops
        console.log('\n3. Testing Category Read Operations...');

        // Get Specific Category
        const specCatRes = await axios.get(`${BASE_URL}/categories/${categoryId}`, { headers });
        if (specCatRes.data.id === categoryId) {
            console.log('✅ GET /categories/:id: Success');
        } else {
            console.error('❌ GET /categories/:id: ID mismatch');
        }

        // 4. Test Product Read Ops
        console.log('\n4. Testing Product Read Operations...');

        // Get Specific Product
        const specProdRes = await axios.get(`${BASE_URL}/products/${productId}`, { headers });
        if (specProdRes.data.id === productId) {
            console.log('✅ GET /products/:id: Success');
        } else {
            console.error('❌ GET /products/:id: ID mismatch');
        }

        // Get Products by Category
        const filteredProdRes = await axios.get(`${BASE_URL}/products?categoryId=${categoryId}`, { headers });
        const allMatch = filteredProdRes.data.every(p => p.categoryId === categoryId);
        if (filteredProdRes.data.length > 0 && allMatch) {
            console.log(`✅ GET /products?categoryId=...: Found ${filteredProdRes.data.length} products, all matching category.`);
        } else {
            console.error('❌ GET /products?categoryId=...: Failed or empty');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }

    console.log('\n🎉 Read Operations Tests Completed.');
};

runTests();
