const { admin } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // --- Multi-Tenancy Context Switching ---
        const userBusinessIds = decodedToken.businessIds || [];
        const requestedBusinessId = req.headers['x-business-id'];

        if (requestedBusinessId) {
            // Validate if user has access to this business
            if (userBusinessIds.includes(requestedBusinessId)) {
                decodedToken.businessId = requestedBusinessId; // Set context for controllers
            } else {
                return res.status(403).json({ message: 'Unauthorized access to this business context' });
            }
        } else {
            // Fallback: If no header, check if user has single business or rely on default claim
            if (userBusinessIds.length === 1) {
                decodedToken.businessId = userBusinessIds[0];
            }
            // If multiply businesses and no header, decodedToken.businessId might remain as the "default" one from claim, 
            // or undefined if we removed it from claims. Ideally, client SHOULD send header.
        }
        // ---------------------------------------

        req.user = decodedToken; // Attach user claims to request
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = { verifyToken };
