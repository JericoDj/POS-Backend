const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
const axios = require('axios');

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
