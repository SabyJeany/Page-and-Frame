import 'dotenv/config'; // Load environment variables from .env
import express from 'express';
import connectMongo from './config/mongo.js'; // Import MongoDB connection function
import { testMysql } from './config/mysql.js'; // Import MySQL test function
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

// Test MySQL connection
testMysql();

const app = express();

// Parse JSON sent by the front-end
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes); // Use the auth routes for /api/auth endpoints

// Connect to MongoDB
connectMongo();

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Page & Frame API is running' });
});

app.listen(5000, () => {
    console.log('server is running on port 5000');
});