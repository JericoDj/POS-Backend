const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
        serviceAccount = require('../../serviceAccountKey.json');
    }
} catch (error) {
    console.error('Failed to load service account key:', error);
}

try {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: "restaurant-pos-165f6.firebasestorage.app"
        });
        console.log('Firebase Admin Initialized');
    } else {
        console.error('Firebase Admin not initialized: No service account provided');
    }
    console.log('Firebase Admin Initialized');
} catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const messaging = admin.messaging();

module.exports = { admin, db, auth, storage, messaging };
