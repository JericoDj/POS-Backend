const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
    process.exit(1);
}

let serviceAccount;

try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    // Fix newline issue in private key
    if (serviceAccount.private_key) {
        serviceAccount.private_key =
            serviceAccount.private_key.replace(/\\n/g, '\n');
    }
} catch (error) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:', error);
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "restaurant-pos-165f6.firebasestorage.app"
    });

    console.log('✅ Firebase Admin Initialized');
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const messaging = admin.messaging();

module.exports = { admin, db, auth, storage, messaging };
