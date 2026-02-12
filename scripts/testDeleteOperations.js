const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

// Test Users
const users = [
    { email: `del_user_1_${Date.now()}@example.com`, password: 'password123', name: 'Delete User 1' }
];

let token;
let businessId;
let categoryIds = [];
let productIds = [];

const log = (msg) => console.log(`[TEST] ${msg}`);
const err = (msg, e) => {
    console.error(`[ERROR] ${msg}`);
    if (e.response) {
        console.error(`   Status: ${e.response.status}`);
        console.error(`   Data:`, e.response.data);
    } else {
        console.error(`   Message: ${e.message}`);
    }
};

const setupData = async () => {
    const user = users[0];
    log('1. Setting up test data...');

    // 1. Register or Login
    try {
        await axios.post(`${API_URL}/auth/register`, user);
        log('   User Registered');
    } catch (e) {
        if (e.response && e.response.status === 400) {
            log('   User already exists, proceeding to login.');
        } else {
            err('Register failed', e);
            process.exit(1);
        }
    }

    // 2. Login
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: user.email,
            password: user.password
        });
        token = loginRes.data.idToken;
        log(`   Login Successful. Token Length: ${token ? token.length : 'null'}`);
    } catch (e) {
        err('Login failed', e);
        process.exit(1);
    }

    // 3. Create Business
    try {
        // Try creating business. If user already has one, this might fail or we might need to fetch it.
        // For this test user, we expect no business initially if unique email. 
        // If we reuse user, we should check /auth/me or /business/profile.

        const busRes = await axios.post(`${API_URL}/business`, {
            name: 'Delete Test Biz',
            type: 'retail'
        }, { headers: { Authorization: `Bearer ${token}` } });
        businessId = busRes.data.businessId;
        log(`   Business Created: ${businessId}`);
    } catch (e) {
        // Maybe user already has business?
        // Let's try to get profile
        try {
            const meRes = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (meRes.data.businessId) {
                businessId = meRes.data.businessId;
                log(`   Found existing BusinessId: ${businessId}`);
            } else {
                err('Create Business failed and no existing business found', e);
                process.exit(1);
            }
        } catch (e2) {
            err('Create Business and Fetch Profile failed', e2);
            process.exit(1);
        }
    }

    // REFRESH TOKEN to get claims
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: user.email,
            password: user.password
        });
        token = loginRes.data.idToken;
        log('   Token Refreshed for Claims');
    } catch (e) {
        err('Token Refresh failed', e);
    }

    // 4. Create Categories
    try {
        for (let i = 0; i < 3; i++) {
            const catRes = await axios.post(`${API_URL}/categories`, {
                name: `Del Cat ${i}`
            }, { headers: { Authorization: `Bearer ${token}` } });
            categoryIds.push(catRes.data.id);
        }
        log(`   Categories Created: ${categoryIds.length}`);
    } catch (e) { err('Create Categories failed', e); }

    // 5. Create Products
    try {
        for (let i = 0; i < 3; i++) {
            const prodRes = await axios.post(`${API_URL}/products`, {
                name: `Del Prod ${i}`,
                price: 150,
                categoryId: categoryIds[0]
            }, { headers: { Authorization: `Bearer ${token}` } });
            productIds.push(prodRes.data.id);
        }
        log(`   Products Created: ${productIds.length}`);
    } catch (e) { err('Create Products failed', e); }
};

const testDeleteProduct = async () => {
    if (productIds.length === 0) return;
    const id = productIds.pop();
    log(`2. Testing Single Product Delete (${id})...`);
    try {
        await axios.delete(`${API_URL}/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        log('✅ Single Product Delete Success');
    } catch (e) { err('Single Product Delete Failed', e); }
};

const testBulkDeleteProducts = async () => {
    if (productIds.length === 0) return;
    log(`3. Testing Bulk Product Delete (${productIds.length} items)...`);
    try {
        await axios.delete(`${API_URL}/products/bulk-delete`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { ids: productIds }
        });
        log('✅ Bulk Product Delete Success');
        productIds = [];
    } catch (e) { err('Bulk Product Delete Failed', e); }
};

const testDeleteCategory = async () => {
    if (categoryIds.length === 0) return;
    const id = categoryIds.pop();
    log(`4. Testing Single Category Delete (${id})...`);
    try {
        await axios.delete(`${API_URL}/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        log('✅ Single Category Delete Success');
    } catch (e) { err('Single Category Delete Failed', e); }
};

const testBulkDeleteCategories = async () => {
    if (categoryIds.length === 0) return;
    log(`5. Testing Bulk Category Delete (${categoryIds.length} items)...`);
    try {
        await axios.delete(`${API_URL}/categories/bulk-delete`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { ids: categoryIds }
        });
        log('✅ Bulk Category Delete Success');
        categoryIds = [];
    } catch (e) { err('Bulk Category Delete Failed', e); }
};

const testDeleteBusiness = async () => {
    if (!businessId) return;
    log(`6. Testing Business Delete (${businessId})...`);
    try {
        await axios.delete(`${API_URL}/business/${businessId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        log('✅ Business Delete Success');
    } catch (e) { err('Business Delete Failed', e); }
};


const run = async () => {
    await setupData();
    await testDeleteProduct();
    await testBulkDeleteProducts();
    await testDeleteCategory();
    await testBulkDeleteCategories();
    // await testDeleteBusiness(); // Optional: might fail if products exist? No, hard delete.
    // Let's run it.
    await testDeleteBusiness();

    log('🎉 All Tests Logic Completed.');
};

run();
