import { Redis } from 'ioredis';
import { Worker } from 'bullmq';
import { processAnalytics } from './analytics.worker';
import { processPayouts } from './payout.worker';
import { processEmails } from './email.worker';
import { processCleanup } from './cleanup.worker';
import { processFraudAnalysis } from './fraud.worker';

export async function startWorkers(redis: Redis) {
  const connection = {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password,
  };

  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5');

  // Analytics aggregation worker
  new Worker('analytics-aggregation', processAnalytics, {
    connection,
    concurrency,
  });

  // Payout processing worker
  new Worker('payout-processing', processPayouts, {
    connection,
    concurrency: 2,
  });

  // Email notifications worker
  new Worker('email-notifications', processEmails, {
    connection,
    concurrency: 10,
  });

  // Data cleanup worker
  new Worker('data-cleanup', processCleanup, {
    connection,
    concurrency: 1,
  });

  // Fraud analysis worker
  new Worker('fraud-analysis', processFraudAnalysis, {
    connection,
    concurrency,
  });
}
