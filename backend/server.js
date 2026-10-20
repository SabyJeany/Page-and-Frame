require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const connectMongo = require('./config/mongo'); // Import MongoDB connection function

const app = express();

// Parse JSON sent by the front-end
app.use(express.json());

// Connect to MongoDB
connectMongo();

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Page & Frame API is running' });
});

app.listen(5000, () => {
    console.log('server is running on port 5000');
});