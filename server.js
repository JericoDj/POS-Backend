const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./src/config/firebase'); // Initialize Firebase

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
    res.status(200).json({ message: 'POS Backend is running', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/business', require('./src/routes/businessRoutes'));
app.use('/api/subscription', require('./src/routes/subscriptionRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/sales', require('./src/routes/salesRoutes'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
