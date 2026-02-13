const admin = require('firebase-admin');
const dotenv = require('dotenv');
// Configure dotenv to load from .env file
dotenv.config();

const axios = require('axios');

let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        // Fix for common issue where newlines in private key are treated as literal "\n" strings
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
    } else {
        serviceAccount = require('../serviceAccountKey.json');
    }
} catch (error) {
    console.error('Failed to load service account key:', error.message);
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function listDatabases() {
    try {
        const token = await admin.credential.cert(serviceAccount).getAccessToken();
        const projectId = serviceAccount.project_id;
        console.log(`Using Project ID: ${projectId}`);

        // Auth token object has .access_token
        const accessToken = token.access_token;

        // Firestore Admin API to list databases
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;

        console.log(`Fetching databases from: ${url}`);

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const databases = response.data.databases;
        if (databases && databases.length > 0) {
            console.log('✅ Databases found:');
            databases.forEach(db => {
                // db.name format: "projects/{project_id}/databases/{database_id}"
                const dbId = db.name.split('/').pop();
                console.log(`- ID: ${dbId} (Full Name: ${db.name})`);
            });
        } else {
            console.log('❌ No databases found. You must create one in the Firebase Console.');
        }

    } catch (error) {
        if (error.response) {
            console.error(`❌ API Error: ${error.response.status} ${error.response.statusText}`);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

listDatabases();
