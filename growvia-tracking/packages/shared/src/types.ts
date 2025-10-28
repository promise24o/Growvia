/**
 * Growvia Tracking System - Shared Types
 */

// ============================================================================
// Event Types
// ============================================================================

export type EventType = 'click' | 'visit' | 'signup' | 'purchase' | 'custom';

export type AttributionModel = 'first-click' | 'last-click' | 'linear' | 'time-decay';

export type ValidationMethod = 'auto' | 'manual' | 'webhook';

// ============================================================================
// Core Event Interface
// ============================================================================

export interface TrackingEvent {
  id: string;
  type: EventType;
  timestamp: number;
  
  // Identifiers
  organizationId: string;
  campaignId: string;
  affiliateId: string;
  
  // Session & Attribution
  sessionId: string;
  clickId?: string;
  visitorId?: string;
  
  // User Data
  userId?: string;
  email?: string;
  phone?: string;
  
  // Event-specific Data
  metadata?: Record<string, any>;
  
  // Purchase-specific
  orderId?: string;
  amount?: number;
  currency?: string;
  
  // Custom event
  customEventName?: string;
  
  // Context
  context: EventContext;
  
  // Attribution
  attribution?: AttributionData;
  
  // Status
  status: 'pending' | 'validated' | 'rejected' | 'fraud';
  rejectionReason?: string;
}

export interface EventContext {
  // Page info
  url: string;
  referrer?: string;
  title?: string;
  
  // UTM params
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  
  // Device & Browser
  userAgent: string;
  ip: string;
  language?: string;
  screenResolution?: string;
  
  // Fingerprint
  deviceFingerprint?: string;
  
  // Geo
  country?: string;
  region?: string;
  city?: string;
  
  // Technical
  timestamp: number;
  timezone?: string;
}

export interface AttributionData {
  model: AttributionModel;
  touchpoints: Touchpoint[];
  attributedAffiliateId: string;
  attributionWeight: number; // 0-1 for partial attribution
  conversionWindow: number; // in seconds
}

export interface Touchpoint {
  affiliateId: string;
  campaignId: string;
  timestamp: number;
  type: EventType;
  weight?: number;
}

// ============================================================================
// Commission & Payout
// ============================================================================

export interface CommissionRule {
  type: EventType;
  payout: PayoutConfig;
  validationMethod: ValidationMethod;
  fraudDetection: FraudDetectionConfig;
}

export interface PayoutConfig {
  amount: number;
  isPercentage: boolean;
  currency: string;
  baseField?: string; // e.g., "amount" for percentage of purchase
  minPayout?: number;
  maxPayout?: number;
}

export interface FraudDetectionConfig {
  // Time-based
  conversionDelay?: number; // minimum seconds between click and conversion
  conversionWindow?: number; // maximum seconds (default 7 days)
  
  // IP & Device
  ipRestriction?: 'none' | 'unique-per-conversion' | 'unique-per-day';
  deviceFingerprintChecks?: boolean;
  proxyVpnDetection?: boolean;
  
  // User validation
  duplicateEmailPhoneBlock?: boolean;
  kycVerifiedOnly?: boolean;
  
  // Geographic
  geoTargeting?: string[]; // allowed countries
  geoBlacklist?: string[]; // blocked countries
  
  // Order validation
  minimumOrderValue?: number;
  maximumOrderValue?: number;
  
  // Behavioral
  minimumTimeOnSite?: number; // seconds
  minimumPageViews?: number;
  
  // Alerts
  conversionSpikeAlert?: boolean;
  velocityThreshold?: number; // max conversions per hour per affiliate
  
  // Technical
  cookieTamperDetection?: boolean;
  affiliateBlacklist?: string[];
  
  // Custom rules
  customValidation?: string; // webhook URL or function name
}

// ============================================================================
// Click & Session Tracking
// ============================================================================

export interface ClickData {
  id: string;
  timestamp: number;
  
  affiliateId: string;
  campaignId: string;
  organizationId: string;
  
  sessionId: string;
  visitorId: string;
  
  context: EventContext;
  
  // Attribution window
  expiresAt: number;
  
  // Conversion tracking
  converted: boolean;
  conversionId?: string;
  conversionType?: EventType;
  conversionTimestamp?: number;
}

export interface SessionData {
  id: string;
  visitorId: string;
  
  startTime: number;
  lastActivityTime: number;
  
  pageViews: number;
  events: string[]; // event IDs
  
  // Attribution
  firstClickId?: string;
  lastClickId?: string;
  allClickIds: string[];
  
  // Context
  initialReferrer?: string;
  initialUrl?: string;
  
  // Fingerprint
  deviceFingerprint?: string;
  ip: string;
}

// ============================================================================
// Analytics & Reporting
// ============================================================================

export interface AffiliatePerformance {
  affiliateId: string;
  campaignId: string;
  period: DateRange;
  
  metrics: {
    clicks: number;
    visits: number;
    signups: number;
    purchases: number;
    customEvents: number;
    
    conversionRate: number;
    averageOrderValue?: number;
    totalRevenue?: number;
    
    totalPayout: number;
    pendingPayout: number;
    paidPayout: number;
  };
  
  topPerformingDays?: DailyMetrics[];
  fraudFlags?: number;
}

export interface CampaignInsights {
  campaignId: string;
  organizationId: string;
  period: DateRange;
  
  overview: {
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    totalPayout: number;
    roi: number;
    
    activeAffiliates: number;
    topAffiliates: string[];
  };
  
  breakdown: {
    byEventType: Record<EventType, number>;
    byAffiliate: Record<string, AffiliatePerformance>;
    byDay: DailyMetrics[];
    byCountry?: Record<string, number>;
  };
  
  fraudDetection: {
    totalFlagged: number;
    flaggedByReason: Record<string, number>;
  };
}

export interface DailyMetrics {
  date: string; // ISO date
  clicks: number;
  conversions: number;
  revenue: number;
  payout: number;
}

export interface DateRange {
  start: string; // ISO date
  end: string; // ISO date
}

// ============================================================================
// SDK Configuration
// ============================================================================

export interface SDKConfig {
  organizationKey: string;
  apiEndpoint?: string;
  
  // Cookie settings
  cookieDomain?: string;
  cookiePath?: string;
  cookieTTL?: number; // seconds, default 7 days
  
  // Attribution
  attributionModel?: AttributionModel;
  conversionWindow?: number; // seconds
  
  // Tracking options
  autoTrackPageViews?: boolean;
  autoTrackClicks?: boolean;
  captureUtmParams?: boolean;
  
  // Privacy
  respectDoNotTrack?: boolean;
  anonymizeIp?: boolean;
  
  // Performance
  batchEvents?: boolean;
  batchSize?: number;
  batchInterval?: number; // ms
  offlineQueue?: boolean;
  
  // Debug
  debug?: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface TrackEventRequest {
  type: EventType;
  
  // Required for all events
  organizationId: string;
  campaignId: string;
  affiliateId: string;
  
  // Optional identifiers
  userId?: string;
  email?: string;
  phone?: string;
  
  // Event data
  metadata?: Record<string, any>;
  
  // Purchase-specific
  orderId?: string;
  amount?: number;
  currency?: string;
  
  // Custom event
  customEventName?: string;
  
  // Context (auto-captured by SDK, or provided by server)
  context?: Partial<EventContext>;
  
  // Session tracking
  sessionId?: string;
  clickId?: string;
  visitorId?: string;
}

export interface TrackEventResponse {
  success: boolean;
  eventId: string;
  message?: string;
  
  // Attribution info
  attributed?: boolean;
  attributedAffiliateId?: string;
  
  // Validation
  validated?: boolean;
  fraudFlags?: string[];
}

export interface ValidateConversionRequest {
  eventId: string;
  organizationId: string;
  
  // Manual validation
  approved?: boolean;
  rejectionReason?: string;
}

export interface ValidateConversionResponse {
  success: boolean;
  eventId: string;
  status: 'validated' | 'rejected';
  payout?: number;
}

// ============================================================================
// Database Models (for Prisma)
// ============================================================================

export interface EventModel {
  id: string;
  type: EventType;
  timestamp: Date;
  
  organizationId: string;
  campaignId: string;
  affiliateId: string;
  
  sessionId: string;
  clickId?: string;
  visitorId?: string;
  
  userId?: string;
  email?: string;
  phone?: string;
  
  metadata?: any; // JSON
  
  orderId?: string;
  amount?: number;
  currency?: string;
  
  customEventName?: string;
  
  context: any; // JSON
  attribution?: any; // JSON
  
  status: string;
  rejectionReason?: string;
  
  payout?: number;
  payoutCurrency?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ClickModel {
  id: string;
  timestamp: Date;
  
  affiliateId: string;
  campaignId: string;
  organizationId: string;
  
  sessionId: string;
  visitorId: string;
  
  context: any; // JSON
  
  expiresAt: Date;
  
  converted: boolean;
  conversionId?: string;
  conversionType?: string;
  conversionTimestamp?: Date;
  
  createdAt: Date;
}

export interface SessionModel {
  id: string;
  visitorId: string;
  
  startTime: Date;
  lastActivityTime: Date;
  
  pageViews: number;
  events: string[]; // JSON array
  
  firstClickId?: string;
  lastClickId?: string;
  allClickIds: string[]; // JSON array
  
  initialReferrer?: string;
  initialUrl?: string;
  
  deviceFingerprint?: string;
  ip: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Webhook & Postback
// ============================================================================

export interface WebhookPayload {
  event: 'conversion.created' | 'conversion.validated' | 'conversion.rejected' | 'payout.processed';
  timestamp: number;
  data: TrackingEvent | any;
  signature: string;
}

export interface PostbackConfig {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, string>; // template variables like {affiliate_id}, {amount}
  retryAttempts?: number;
  retryDelay?: number; // ms
}

// ============================================================================
// Error Types
// ============================================================================

export class TrackingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'TrackingError';
  }
}

export const ErrorCodes = {
  INVALID_EVENT: 'INVALID_EVENT',
  INVALID_ORGANIZATION: 'INVALID_ORGANIZATION',
  INVALID_CAMPAIGN: 'INVALID_CAMPAIGN',
  INVALID_AFFILIATE: 'INVALID_AFFILIATE',
  FRAUD_DETECTED: 'FRAUD_DETECTED',
  DUPLICATE_EVENT: 'DUPLICATE_EVENT',
  EXPIRED_CLICK: 'EXPIRED_CLICK',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;
