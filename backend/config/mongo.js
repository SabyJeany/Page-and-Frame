import mongoose from 'mongoose';

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // connect the server to the MongoDB database, using the connection string stored in .env
    // server log: the connection worked
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('Error MongoDB :', error.message);
  }
}

// Export the function so server.js can call it at startup
export default connectMongo;