const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/auth';
const TEST_USER = {
    email: `test_user_${Date.now()}@example.com`,
    password: 'Password123!',
    displayName: 'Test User'
};

const runTests = async () => {
    console.log('🧪 Starting Auth Endpoint Tests...\n');

    let userId = null;
    let idToken = null;

    // 1. Test Register
    try {
        console.log('1. Testing Register...');
        const res = await axios.post(`${BASE_URL}/register`, TEST_USER);
        console.log('✅ Register Passed:', res.data.message);
        userId = res.data.user.uid;
    } catch (error) {
        console.error('❌ Register Failed:', error.response?.data || error.message);
        process.exit(1); // Cannot proceed if register fails
    }

    // 2. Test Login
    try {
        console.log('\n2. Testing Login...');
        const res = await axios.post(`${BASE_URL}/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        console.log('✅ Login Passed');
        idToken = res.data.idToken;
    } catch (error) {
        if (error.response?.data?.message?.includes('Missing FIREBASE_WEB_API_KEY')) {
            console.warn('⚠️ Login Skipped: Missing FIREBASE_WEB_API_KEY in .env. Cannot get ID Token to test protected routes.');
        } else {
            console.error('❌ Login Failed:', error.response?.data || error.message);
        }
    }

    // Stop if no token (due to missing API Key)
    if (!idToken) {
        console.log('\n⚠️ Stopping tests for Protected Routes (No ID Token available).');
        console.log('\nTo fully test Login, GetMe, Update, Delete:');
        console.log('1. Get Web API Key from Firebase Console.');
        console.log('2. Add FIREBASE_WEB_API_KEY to backend/.env');
        console.log('3. Restart server and run this script again.');
        return;
    }

    // 3. Test Get Me (Protected)
    try {
        console.log('\n3. Testing Get Me...');
        const res = await axios.get(`${BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        console.log('✅ Get Me Passed:', res.data.email);
    } catch (error) {
        console.error('❌ Get Me Failed:', error.response?.data || error.message);
    }

    // 4. Test Update User (Protected)
    try {
        console.log('\n4. Testing Update User...');
        const res = await axios.put(`${BASE_URL}/update`, {
            displayName: 'Updated Name'
        }, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        console.log('✅ Update User Passed:', res.data.message);
    } catch (error) {
        console.error('❌ Update User Failed:', error.response?.data || error.message);
    }

    // 5. Test Forgot Password
    try {
        console.log('\n5. Testing Forgot Password...');
        const res = await axios.post(`${BASE_URL}/forgot-password`, {
            email: TEST_USER.email
        });
        console.log('✅ Forgot Password Passed:', res.data.message);
    } catch (error) {
        if (error.response?.data?.message?.includes('Missing FIREBASE_WEB_API_KEY')) {
            console.warn('⚠️ Forgot Password Skipped: Missing FIREBASE_WEB_API_KEY.');
        } else {
            console.error('❌ Forgot Password Failed:', error.response?.data || error.message);
        }
    }

    // 6. Test Delete Account (Protected)
    try {
        console.log('\n6. Testing Delete Account...');
        const res = await axios.delete(`${BASE_URL}/delete`, {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        console.log('✅ Delete Account Passed:', res.data.message);
    } catch (error) {
        console.error('❌ Delete Account Failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 All Tests Completed.');
};

runTests();
