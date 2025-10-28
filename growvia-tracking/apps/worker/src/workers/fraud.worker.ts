import { Job } from 'bullmq';
import mongoose from 'mongoose';
import { FraudAnalysisJob } from '../queues/jobs';

// Define TrackingEvent model inline
const TrackingEventSchema = new mongoose.Schema({
  eventId: String,
  affiliateId: mongoose.Schema.Types.ObjectId,
  campaignId: mongoose.Schema.Types.ObjectId,
  timestamp: Date,
  status: String,
  rejectionReason: String,
  fraudFlags: [String],
  context: mongoose.Schema.Types.Mixed,
});

const TrackingEvent = mongoose.model('TrackingEvent', TrackingEventSchema);

export async function processFraudAnalysis(job: Job<FraudAnalysisJob>) {
  const { eventId, affiliateId, campaignId } = job.data;

  await job.updateProgress(10);

  // Get event
  const event = await TrackingEvent.findOne({ eventId });
  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  await job.updateProgress(30);

  // Analyze affiliate patterns
  const recentEvents = await TrackingEvent.find({
    affiliateId: new mongoose.Types.ObjectId(affiliateId),
    campaignId: new mongoose.Types.ObjectId(campaignId),
    timestamp: {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    },
  });

  await job.updateProgress(60);

  const fraudScore = calculateFraudScore(event, recentEvents);

  await job.updateProgress(80);

  // Update event with fraud score
  if (fraudScore > 0.7) {
    await TrackingEvent.findOneAndUpdate(
      { eventId },
      {
        $set: {
          status: 'fraud',
          rejectionReason: 'High fraud score from ML analysis',
        },
        $push: {
          fraudFlags: `ML_FRAUD_SCORE_${fraudScore.toFixed(2)}`,
        },
      }
    );
  }

  await job.updateProgress(100);

  console.log(`Fraud analysis completed for event ${eventId}: score ${fraudScore}`);

  return { eventId, fraudScore, flagged: fraudScore > 0.7 };
}

function calculateFraudScore(event: any, recentEvents: any[]): number {
  let score = 0;

  // High velocity
  if (recentEvents.length > 20) {
    score += 0.3;
  }

  // Suspicious patterns
  const sameIpCount = recentEvents.filter(
    (e) => e.context?.ip === event.context?.ip
  ).length;
  if (sameIpCount > 5) {
    score += 0.4;
  }

  // Time-based patterns
  const timestamps = recentEvents.map((e) => e.timestamp.getTime());
  const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (avgInterval < 60000) {
    // Less than 1 minute average
    score += 0.3;
  }

  return Math.min(score, 1);
}
