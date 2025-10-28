import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export interface Queues {
  analyticsQueue: Queue;
  payoutQueue: Queue;
  emailQueue: Queue;
  cleanupQueue: Queue;
  fraudAnalysisQueue: Queue;
}

export function initializeQueues(redis: Redis): Queues {
  const connection = {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password,
  };

  return {
    analyticsQueue: new Queue('analytics-aggregation', { connection }),
    payoutQueue: new Queue('payout-processing', { connection }),
    emailQueue: new Queue('email-notifications', { connection }),
    cleanupQueue: new Queue('data-cleanup', { connection }),
    fraudAnalysisQueue: new Queue('fraud-analysis', { connection }),
  };
}

export * from './jobs';
