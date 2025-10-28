import cron from 'node-cron';
import { Queues } from '../queues';

export function startCronJobs(queues: Queues) {
  // Daily analytics aggregation (midnight)
  cron.schedule(
    process.env.ANALYTICS_AGGREGATION_CRON || '0 0 * * *',
    async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const date = yesterday.toISOString().split('T')[0];

      await queues.analyticsQueue.add('daily-aggregation', { date });
      console.log(`Scheduled analytics aggregation for ${date}`);
    }
  );

  // Daily payout processing (2 AM)
  cron.schedule(
    process.env.PAYOUT_PROCESSING_CRON || '0 2 * * *',
    async () => {
      const period = new Date().toISOString().split('T')[0];

      // Process payouts for all organizations (implement organization iteration)
      await queues.payoutQueue.add('daily-payout', {
        organizationId: 'all',
        period,
      });
      console.log(`Scheduled payout processing for ${period}`);
    }
  );

  // Daily data cleanup (3 AM)
  cron.schedule(
    process.env.DATA_CLEANUP_CRON || '0 3 * * *',
    async () => {
      const thirtyDaysAgo = 30 * 24 * 60 * 60 * 1000;
      const ninetyDaysAgo = 90 * 24 * 60 * 60 * 1000;

      await queues.cleanupQueue.add('cleanup-sessions', {
        type: 'sessions',
        olderThan: thirtyDaysAgo,
      });

      await queues.cleanupQueue.add('cleanup-clicks', {
        type: 'clicks',
        olderThan: thirtyDaysAgo,
      });

      await queues.cleanupQueue.add('archive-events', {
        type: 'events',
        olderThan: ninetyDaysAgo,
      });

      console.log('Scheduled data cleanup jobs');
    }
  );

  // Hourly fraud analysis for recent events
  cron.schedule('0 * * * *', async () => {
    // Implement: Find recent high-value conversions and queue for analysis
    console.log('Scheduled fraud analysis for recent events');
  });

  console.log('✓ Cron jobs registered');
}
