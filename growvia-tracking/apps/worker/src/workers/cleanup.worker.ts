import { Job } from 'bullmq';
import mongoose from 'mongoose';
import { DataCleanupJob } from '../queues/jobs';

// Define models inline
const TrackingEvent = mongoose.model('TrackingEvent', new mongoose.Schema({
  timestamp: Date,
  archived: Boolean,
}));

const ClickTracking = mongoose.model('ClickTracking', new mongoose.Schema({
  expiresAt: Date,
  converted: Boolean,
}));

const SessionTracking = mongoose.model('SessionTracking', new mongoose.Schema({
  lastActivityTime: Date,
}));

export async function processCleanup(job: Job<DataCleanupJob>) {
  const { type, olderThan } = job.data;

  await job.updateProgress(10);

  const cutoffDate = new Date(Date.now() - olderThan);

  let deletedCount = 0;

  switch (type) {
    case 'sessions':
      const result1 = await SessionTracking.deleteMany({
        lastActivityTime: { $lt: cutoffDate },
      });
      deletedCount = result1.deletedCount || 0;
      break;

    case 'clicks':
      const result2 = await ClickTracking.deleteMany({
        expiresAt: { $lt: cutoffDate },
        converted: false,
      });
      deletedCount = result2.deletedCount || 0;
      break;

    case 'events':
      // Archive old events instead of deleting
      const result3 = await TrackingEvent.updateMany(
        {
          timestamp: { $lt: cutoffDate },
          archived: { $ne: true },
        },
        {
          $set: { archived: true },
        }
      );
      deletedCount = result3.modifiedCount || 0;
      break;
  }

  await job.updateProgress(100);

  console.log(`Cleaned up ${deletedCount} ${type} records older than ${cutoffDate.toISOString()}`);

  return { deletedCount, type };
}
