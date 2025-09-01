import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Simple logging function for database operations
function log(message: string, source = 'db') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Load environment variables
dotenv.config();

// Get MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growvia';

// Connect to MongoDB
export async function connectToDatabase() {
  log('Connecting to MongoDB...', 'mongoose');
  
  try {
    await mongoose.connect(MONGODB_URI);
    log('Connected to MongoDB', 'mongoose');
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongoose');
    process.exit(1);
  }

  // Handle connection events
  mongoose.connection.on('error', err => {
    log(`MongoDB connection error: ${err}`, 'mongoose');
  });

  mongoose.connection.on('disconnected', () => {
    log('MongoDB disconnected', 'mongoose');
  });

  // Handle application termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    log('MongoDB connection closed due to app termination', 'mongoose');
    process.exit(0);
  });
}