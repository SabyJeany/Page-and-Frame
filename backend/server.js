import 'dotenv/config'; // Load environment variables from .env
import express from 'express'; // Import Express framework
import connectMongo from './config/mongo.js'; // Import MongoDB connection function
import { testMysql } from './config/mysql.js'; // Import MySQL test function
import cors from 'cors'; // Import CORS middleware to allow cross-origin requests
import authRoutes from './routes/auth.routes.js'; // Import authentication routes
import filmRoutes from './routes/films.routes.js'; // Import film routes
import personRoutes from './routes/persons.routes.js';

// Test MySQL connection
testMysql();

const app = express();

// Parse JSON sent by the front-end
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes); // Use the auth routes for /api/auth endpoints
app.use('/api/films', filmRoutes); // Use the film routes for /api/films endpoints
app.use('/api/persons', personRoutes);
// Connect to MongoDB
connectMongo();

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Page & Frame API is running' });
});

app.listen(5000, () => {
    console.log('server is running on port 5000');
});