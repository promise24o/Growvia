/**
 * Growvia Tracking System - Shared Types
 */
export type EventType = 'click' | 'visit' | 'signup' | 'purchase' | 'custom';
export type AttributionModel = 'first-click' | 'last-click' | 'linear' | 'time-decay';
export type ValidationMethod = 'auto' | 'manual' | 'webhook';
export interface TrackingEvent {
    id: string;
    type: EventType;
    timestamp: number;
    organizationId: string;
    campaignId: string;
    affiliateId: string;
    sessionId: string;
    clickId?: string;
    visitorId?: string;
    userId?: string;
    email?: string;
    phone?: string;
    metadata?: Record<string, any>;
    orderId?: string;
    amount?: number;
    currency?: string;
    customEventName?: string;
    context: EventContext;
    attribution?: AttributionData;
    status: 'pending' | 'validated' | 'rejected' | 'fraud';
    rejectionReason?: string;
}
export interface EventContext {
    url: string;
    referrer?: string;
    title?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    userAgent: string;
    ip: string;
    language?: string;
    screenResolution?: string;
    deviceFingerprint?: string;
    country?: string;
    region?: string;
    city?: string;
    timestamp: number;
    timezone?: string;
}
export interface AttributionData {
    model: AttributionModel;
    touchpoints: Touchpoint[];
    attributedAffiliateId: string;
    attributionWeight: number;
    conversionWindow: number;
}
export interface Touchpoint {
    affiliateId: string;
    campaignId: string;
    timestamp: number;
    type: EventType;
    weight?: number;
}
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
    baseField?: string;
    minPayout?: number;
    maxPayout?: number;
}
export interface FraudDetectionConfig {
    conversionDelay?: number;
    conversionWindow?: number;
    ipRestriction?: 'none' | 'unique-per-conversion' | 'unique-per-day';
    deviceFingerprintChecks?: boolean;
    proxyVpnDetection?: boolean;
    duplicateEmailPhoneBlock?: boolean;
    kycVerifiedOnly?: boolean;
    geoTargeting?: string[];
    geoBlacklist?: string[];
    minimumOrderValue?: number;
    maximumOrderValue?: number;
    minimumTimeOnSite?: number;
    minimumPageViews?: number;
    conversionSpikeAlert?: boolean;
    velocityThreshold?: number;
    cookieTamperDetection?: boolean;
    affiliateBlacklist?: string[];
    customValidation?: string;
}
export interface ClickData {
    id: string;
    timestamp: number;
    affiliateId: string;
    campaignId: string;
    organizationId: string;
    sessionId: string;
    visitorId: string;
    context: EventContext;
    expiresAt: number;
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
    events: string[];
    firstClickId?: string;
    lastClickId?: string;
    allClickIds: string[];
    initialReferrer?: string;
    initialUrl?: string;
    deviceFingerprint?: string;
    ip: string;
}
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
    date: string;
    clicks: number;
    conversions: number;
    revenue: number;
    payout: number;
}
export interface DateRange {
    start: string;
    end: string;
}
export interface SDKConfig {
    organizationKey: string;
    apiEndpoint?: string;
    cookieDomain?: string;
    cookiePath?: string;
    cookieTTL?: number;
    attributionModel?: AttributionModel;
    conversionWindow?: number;
    autoTrackPageViews?: boolean;
    autoTrackClicks?: boolean;
    captureUtmParams?: boolean;
    respectDoNotTrack?: boolean;
    anonymizeIp?: boolean;
    batchEvents?: boolean;
    batchSize?: number;
    batchInterval?: number;
    offlineQueue?: boolean;
    debug?: boolean;
}
export interface TrackEventRequest {
    type: EventType;
    organizationId: string;
    campaignId: string;
    affiliateId: string;
    userId?: string;
    email?: string;
    phone?: string;
    metadata?: Record<string, any>;
    orderId?: string;
    amount?: number;
    currency?: string;
    customEventName?: string;
    context?: Partial<EventContext>;
    sessionId?: string;
    clickId?: string;
    visitorId?: string;
}
export interface TrackEventResponse {
    success: boolean;
    eventId: string;
    message?: string;
    attributed?: boolean;
    attributedAffiliateId?: string;
    validated?: boolean;
    fraudFlags?: string[];
}
export interface ValidateConversionRequest {
    eventId: string;
    organizationId: string;
    approved?: boolean;
    rejectionReason?: string;
}
export interface ValidateConversionResponse {
    success: boolean;
    eventId: string;
    status: 'validated' | 'rejected';
    payout?: number;
}
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
    metadata?: any;
    orderId?: string;
    amount?: number;
    currency?: string;
    customEventName?: string;
    context: any;
    attribution?: any;
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
    context: any;
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
    events: string[];
    firstClickId?: string;
    lastClickId?: string;
    allClickIds: string[];
    initialReferrer?: string;
    initialUrl?: string;
    deviceFingerprint?: string;
    ip: string;
    createdAt: Date;
    updatedAt: Date;
}
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
    params?: Record<string, string>;
    retryAttempts?: number;
    retryDelay?: number;
}
export declare class TrackingError extends Error {
    code: string;
    statusCode: number;
    details?: any | undefined;
    constructor(message: string, code: string, statusCode?: number, details?: any | undefined);
}
export declare const ErrorCodes: {
    readonly INVALID_EVENT: "INVALID_EVENT";
    readonly INVALID_ORGANIZATION: "INVALID_ORGANIZATION";
    readonly INVALID_CAMPAIGN: "INVALID_CAMPAIGN";
    readonly INVALID_AFFILIATE: "INVALID_AFFILIATE";
    readonly FRAUD_DETECTED: "FRAUD_DETECTED";
    readonly DUPLICATE_EVENT: "DUPLICATE_EVENT";
    readonly EXPIRED_CLICK: "EXPIRED_CLICK";
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
};
//# sourceMappingURL=types.d.ts.map