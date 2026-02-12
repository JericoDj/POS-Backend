const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
// Use a fresh user for update tests to avoid interference
const TEST_USER = {
    email: `biz_update_${Date.now()}@example.com`,
    password: 'Password123!',
    displayName: 'Update Test User'
};

const runTests = async () => {
    console.log('🧪 Starting Update Operations Tests...\n');

    let token = null;
    let userId = null;
    let businessId = null;
    let categoryId = null;
    let productId = null;

    try {
        // 1. SETUP
        console.log('1. Setting up test data...');
        // Register
        await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
        // Login
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
        token = loginRes.data.idToken;
        let headers = { Authorization: `Bearer ${token}` };

        // Create Business
        const bizRes = await axios.post(`${BASE_URL}/business`, { name: 'Original Name', type: 'Retail' }, { headers });
        businessId = bizRes.data.businessId;

        // Re-login for claims
        const loginRes2 = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
        token = loginRes2.data.idToken;
        headers = { Authorization: `Bearer ${token}` };

        // Create Category
        const catRes = await axios.post(`${BASE_URL}/categories`, { name: 'Original Cat' }, { headers });
        categoryId = catRes.data.id;

        // Create Product
        const prodRes = await axios.post(`${BASE_URL}/products`, { name: 'Original Prod', price: 10, categoryId: categoryId }, { headers });
        productId = prodRes.data.id;

        console.log('✅ Setup Complete.');

        // 2. Test Business Update
        console.log('\n2. Testing Business Update...');
        await axios.put(`${BASE_URL}/business/${businessId}`, { name: 'Updated Business Name' }, { headers });
        const checkBiz = await axios.get(`${BASE_URL}/business/${businessId}`, { headers });
        if (checkBiz.data.name === 'Updated Business Name') {
            console.log('✅ Business Update Success');
        } else {
            console.error('❌ Business Update Failed. Name is:', checkBiz.data.name);
        }

        // 3. Test Category Update
        console.log('\n3. Testing Category Update...');
        await axios.put(`${BASE_URL}/categories/${categoryId}`, { name: 'Updated Cat Name' }, { headers });
        const checkCat = await axios.get(`${BASE_URL}/categories/${categoryId}`, { headers });
        if (checkCat.data.name === 'Updated Cat Name') {
            console.log('✅ Category Update Success');
        } else {
            console.error('❌ Category Update Failed. Name is:', checkCat.data.name);
        }

        // 4. Test Product Update
        console.log('\n4. Testing Product Update...');
        await axios.put(`${BASE_URL}/products/${productId}`, { name: 'Updated Prod Name', price: 20 }, { headers });
        const checkProd = await axios.get(`${BASE_URL}/products/${productId}`, { headers });
        if (checkProd.data.name === 'Updated Prod Name' && checkProd.data.price === 20) {
            console.log('✅ Product Update Success');
        } else {
            console.error('❌ Product Update Failed:', checkProd.data);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }

    console.log('\n🎉 Update Operations Tests Completed.');
};

runTests();
