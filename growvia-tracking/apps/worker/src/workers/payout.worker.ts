import { Job } from 'bullmq';
import mongoose from 'mongoose';
import { PayoutProcessingJob } from '../queues/jobs';

// Define TrackingEvent model inline
const TrackingEventSchema = new mongoose.Schema({
  eventId: String,
  organizationId: mongoose.Schema.Types.ObjectId,
  campaignId: mongoose.Schema.Types.ObjectId,
  affiliateId: mongoose.Schema.Types.ObjectId,
  status: String,
  payoutStatus: String,
  payout: Number,
});

const TrackingEvent = mongoose.model('TrackingEvent', TrackingEventSchema);

export async function processPayouts(job: Job<PayoutProcessingJob>) {
  const { organizationId, campaignId, period } = job.data;

  await job.updateProgress(10);

  // Find all validated conversions pending payout
  const query: any = {
    organizationId: new mongoose.Types.ObjectId(organizationId),
    status: 'validated',
    payoutStatus: 'pending',
  };

  if (campaignId) {
    query.campaignId = new mongoose.Types.ObjectId(campaignId);
  }

  const events = await TrackingEvent.find(query);

  await job.updateProgress(30);

  // Group by affiliate
  const payoutsByAffiliate = events.reduce((acc, event) => {
    const affiliateId = event.affiliateId?.toString();
    if (!affiliateId) return acc; // Skip if no affiliate ID
    
    if (!acc[affiliateId]) {
      acc[affiliateId] = {
        affiliateId,
        events: [],
        totalPayout: 0,
      };
    }
    acc[affiliateId].events.push(event.eventId);
    acc[affiliateId].totalPayout += event.payout || 0;
    return acc;
  }, {} as Record<string, any>);

  await job.updateProgress(60);

  // Process payouts (integrate with payment provider)
  for (const [affiliateId, payout] of Object.entries(payoutsByAffiliate)) {
    console.log(`Processing payout for affiliate ${affiliateId}:`, payout);

    // Update event payout status
    await TrackingEvent.updateMany(
      { eventId: { $in: (payout as any).events } },
      { $set: { payoutStatus: 'processing' } }
    );
  }

  await job.updateProgress(90);

  console.log(`Processed ${Object.keys(payoutsByAffiliate).length} payouts for period ${period}`);

  await job.updateProgress(100);

  return { payoutsProcessed: Object.keys(payoutsByAffiliate).length };
}
