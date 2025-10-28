import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { initializeQueues } from './queues';
import { startCronJobs } from './cron';
import { startWorkers } from './workers';

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/growvia');
    console.log('✓ Connected to MongoDB');

    // Initialize job queues
    const queues = initializeQueues(redis);
    console.log('✓ Job queues initialized');

    // Start workers
    await startWorkers(redis);
    console.log('✓ Workers started');

    // Start cron jobs
    if (process.env.ENABLE_CRON_JOBS === 'true') {
      startCronJobs(queues);
      console.log('✓ Cron jobs scheduled');
    }

    console.log('🚀 Worker service is running');
  } catch (error) {
    console.error('Failed to start worker service:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.disconnect();
  await redis.quit();
  process.exit(0);
});

main();
