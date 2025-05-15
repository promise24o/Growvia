import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { log } from './vite';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

// Connection options to avoid deprecation warnings
const options = {
  autoIndex: true, // Build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
};

// Connect to MongoDB
export async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    log(`Connecting to MongoDB...`, 'mongoose');
    await mongoose.connect(MONGODB_URI, options);
    log(`Connected to MongoDB`, 'mongoose');
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongoose');
    process.exit(1);
  }
}

// Listen for connection events
mongoose.connection.on('error', err => {
  log(`MongoDB connection error: ${err}`, 'mongoose');
});

mongoose.connection.on('disconnected', () => {
  log('MongoDB disconnected', 'mongoose');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  log('MongoDB connection closed due to app termination', 'mongoose');
  process.exit(0);
});

export default mongoose;