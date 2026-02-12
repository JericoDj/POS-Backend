const { admin, db } = require('../config/firebase');
const axios = require('axios');

// Get API Key from env
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

// 1. Register User
const register = async (req, res) => {
    const { email, password, displayName, role, businessId } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: displayName || '',
        });

        // Create user document in Firestore
        const userData = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: displayName || '',
            role: role || 'staff', // owner, manager, staff
            businessId: businessId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active',
        };

        await db.collection('users').doc(userRecord.uid).set(userData);

        // Set custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: role || 'staff',
            businessId: businessId || null
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: userData
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// 2. Login (Proxy to Firebase REST API)
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!FIREBASE_WEB_API_KEY) {
        return res.status(500).json({ message: 'Server configuration error: Missing FIREBASE_WEB_API_KEY in .env' });
    }

    try {
        const response = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`,
            {
                email,
                password,
                returnSecureToken: true,
            }
        );

        // Return the full response (idToken, email, refreshToken, expiresIn, localId)
        res.status(200).json(response.data);

    } catch (error) {
        console.error('Error logging in:', error.response?.data || error.message);
        const errorMsg = error.response?.data?.error?.message || error.message;
        res.status(401).json({ message: 'Login failed', error: errorMsg });
    }
};

// 3. Get Current User (Protected)
const getMe = async (req, res) => {
    try {
        const uid = req.user.uid; // From authMiddleware
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        res.status(200).json(userDoc.data());

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

// 4. Update User Profile (Protected)
const updateUser = async (req, res) => {
    try {
        const uid = req.user.uid;
        const { displayName, phoneNumber, photoURL } = req.body;

        // Update Auth Profile
        if (displayName || phoneNumber || photoURL) {
            await admin.auth().updateUser(uid, {
                displayName,
                phoneNumber, // must be E.164
                photoURL
            });
        }

        // Update Firestore Document directly
        // Filter out undefined values
        const updateData = {};
        if (displayName) updateData.displayName = displayName;
        if (photoURL) updateData.photoURL = photoURL;
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('users').doc(uid).update(updateData);

        res.status(200).json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

// 5. Forgot Password (Trigger Email)
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    if (!FIREBASE_WEB_API_KEY) {
        return res.status(500).json({ message: 'Server configuration error: Missing FIREBASE_WEB_API_KEY in .env' });
    }

    try {
        await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_WEB_API_KEY}`,
            {
                requestType: "PASSWORD_RESET",
                email: email
            }
        );
        res.status(200).json({ message: 'Password reset email sent' });

    } catch (error) {
        console.error('Error sending reset email:', error.response?.data || error.message);
        res.status(500).json({ message: 'Error sending email', error: error.response?.data?.error?.message || error.message });
    }
};

// 6. Delete Account (Protected)
const deleteAccount = async (req, res) => {
    try {
        const uid = req.user.uid;

        // Delete from Auth
        await admin.auth().deleteUser(uid);

        // Delete from Firestore
        await db.collection('users').doc(uid).delete();

        res.status(200).json({ message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Error deleting account', error: error.message });
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateUser,
    forgotPassword,
    deleteAccount
};
