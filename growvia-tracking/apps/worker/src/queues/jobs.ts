export interface AnalyticsAggregationJob {
  date: string;
  organizationId?: string;
}

export interface PayoutProcessingJob {
  organizationId: string;
  campaignId?: string;
  period: string;
}

export interface EmailNotificationJob {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface DataCleanupJob {
  type: 'sessions' | 'clicks' | 'events';
  olderThan: number;
}

export interface FraudAnalysisJob {
  eventId: string;
  affiliateId: string;
  campaignId: string;
}
