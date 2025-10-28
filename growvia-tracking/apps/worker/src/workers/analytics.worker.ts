import { Job } from 'bullmq';
import mongoose from 'mongoose';
import { AnalyticsAggregationJob } from '../queues/jobs';

// Define TrackingEvent model inline since we can't use workspace dependencies
const TrackingEventSchema = new mongoose.Schema({
  eventId: String,
  type: String,
  timestamp: Date,
  organizationId: mongoose.Schema.Types.ObjectId,
  campaignId: mongoose.Schema.Types.ObjectId,
  affiliateId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  payout: Number,
});

const TrackingEvent = mongoose.model('TrackingEvent', TrackingEventSchema);

export async function processAnalytics(job: Job<AnalyticsAggregationJob>) {
  const { date, organizationId } = job.data;

  await job.updateProgress(10);

  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const matchStage: any = {
    timestamp: { $gte: startDate, $lte: endDate },
  };

  if (organizationId) {
    matchStage.organizationId = new mongoose.Types.ObjectId(organizationId);
  }

  await job.updateProgress(30);

  // Aggregate by campaign
  const campaignStats = await TrackingEvent.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          campaignId: '$campaignId',
          type: '$type',
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalPayout: { $sum: '$payout' },
      },
    },
  ]);

  await job.updateProgress(60);

  // Aggregate by affiliate
  const affiliateStats = await TrackingEvent.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          affiliateId: '$affiliateId',
          campaignId: '$campaignId',
        },
        conversions: { $sum: 1 },
        revenue: { $sum: '$amount' },
        commission: { $sum: '$payout' },
      },
    },
  ]);

  await job.updateProgress(90);

  // Store aggregated data (implement DailyAnalytics model)
  console.log(`Analytics aggregated for ${date}:`, {
    campaigns: campaignStats.length,
    affiliates: affiliateStats.length,
  });

  await job.updateProgress(100);

  return { campaignStats, affiliateStats };
}
