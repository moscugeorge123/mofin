import mongoose from 'mongoose';

export async function connectToDatabase() {
  return await mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/local')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ Connection error:', err));
}
