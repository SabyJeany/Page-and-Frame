import mongoose from 'mongoose';

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('Error MongoDB :', error.message);
  }
}

export default connectMongo;