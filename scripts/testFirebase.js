const { auth, db, storage } = require('../src/config/firebase');

async function testFirebase() {
    console.log('Testing Firebase Connection...');
    let hasError = false;

    // Test Auth
    try {
        console.log('Testing Auth...');
        const listUsersResult = await auth.listUsers(1);
        console.log('✅ Auth Check Passed. Users found:', listUsersResult.users.length);
    } catch (error) {
        console.error('❌ Auth Check Failed:', error.message);
        hasError = true;
    }

    // Test Firestore
    try {
        console.log('Testing Firestore...');
        const testDocRef = db.collection('test_connection').doc('ping');
        await testDocRef.set({ timestamp: new Date(), message: 'Hello Firebase' });
        console.log('✅ Firestore Write Passed.');

        const doc = await testDocRef.get();
        if (doc.exists) {
            console.log('✅ Firestore Read Passed:', doc.data());
        } else {
            console.error('❌ Firestore Read Failed: Document not found');
            hasError = true;
        }

        // Clean up
        await testDocRef.delete();
        console.log('Test Document Deleted.');
    } catch (error) {
        console.error('❌ Firestore Check Failed:', error.message);
        hasError = true;
        if (error.code === 7 || error.message.includes('disabled')) {
            console.log('👉 ACTION REQUIRED: Enable Firestore in Firebase Console (Build -> Firestore Database).');
        }
    }

    // Test Storage
    try {
        console.log('Testing Storage...');
        const [files] = await storage.bucket().getFiles({ maxResults: 1 });
        console.log('✅ Storage Check Passed. Files found:', files.length);
    } catch (error) {
        console.error('❌ Storage Check Failed:', error.message);
        hasError = true;
        if (error.code === 403 || error.message.includes('IAM') || error.message.includes('access')) {
            console.log('👉 ACTION REQUIRED: Enable Storage in Firebase Console (Build -> Storage). Check rules if already enabled.');
        } else if (error.code === 404 || error.message.includes('bucket')) {
            console.log('👉 ACTION REQUIRED: Check your bucket name in `src/config/firebase.js`. It might be incorrect or the bucket does not exist.');
        }
    }

    if (hasError) {
        console.log('\n⚠️ Some tests failed. Please review the errors above.');
        process.exit(1);
    } else {
        console.log('\n🚀 All Firebase tests passed successfully!');
        process.exit(0);
    }
}

testFirebase();
