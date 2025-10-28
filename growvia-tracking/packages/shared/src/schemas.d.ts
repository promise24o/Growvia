/**
 * Growvia Tracking System - Validation Schemas
 */
import * as Yup from 'yup';
export declare const eventTypeSchema: Yup.StringSchema<NonNullable<"click" | "visit" | "signup" | "purchase" | "custom" | undefined>, Yup.AnyObject, undefined, "">;
export declare const attributionModelSchema: Yup.StringSchema<"first-click" | "last-click" | "linear" | "time-decay" | undefined, Yup.AnyObject, "last-click", "d">;
export declare const validationMethodSchema: Yup.StringSchema<"auto" | "manual" | "webhook" | undefined, Yup.AnyObject, "auto", "d">;
export declare const eventContextSchema: Yup.ObjectSchema<{
    url: string;
    referrer: string | undefined;
    title: string | undefined;
    utmSource: string | undefined;
    utmMedium: string | undefined;
    utmCampaign: string | undefined;
    utmTerm: string | undefined;
    utmContent: string | undefined;
    userAgent: string;
    ip: string;
    language: string | undefined;
    screenResolution: string | undefined;
    deviceFingerprint: string | undefined;
    country: string | undefined;
    region: string | undefined;
    city: string | undefined;
    timestamp: number;
    timezone: string | undefined;
}, Yup.AnyObject, {
    url: undefined;
    referrer: undefined;
    title: undefined;
    utmSource: undefined;
    utmMedium: undefined;
    utmCampaign: undefined;
    utmTerm: undefined;
    utmContent: undefined;
    userAgent: undefined;
    ip: undefined;
    language: undefined;
    screenResolution: undefined;
    deviceFingerprint: undefined;
    country: undefined;
    region: undefined;
    city: undefined;
    timestamp: undefined;
    timezone: undefined;
}, "">;
export declare const payoutConfigSchema: Yup.ObjectSchema<{
    amount: number;
    isPercentage: NonNullable<boolean | undefined>;
    currency: string;
    baseField: string | undefined;
    minPayout: number | undefined;
    maxPayout: number | undefined;
}, Yup.AnyObject, {
    amount: undefined;
    isPercentage: undefined;
    currency: "USD";
    baseField: undefined;
    minPayout: undefined;
    maxPayout: undefined;
}, "">;
export declare const fraudDetectionConfigSchema: Yup.ObjectSchema<{
    conversionDelay: number | undefined;
    conversionWindow: number;
    ipRestriction: "none" | "unique-per-conversion" | "unique-per-day";
    deviceFingerprintChecks: boolean;
    proxyVpnDetection: boolean;
    duplicateEmailPhoneBlock: boolean;
    kycVerifiedOnly: boolean;
    geoTargeting: (string | undefined)[] | undefined;
    geoBlacklist: (string | undefined)[] | undefined;
    minimumOrderValue: number | undefined;
    maximumOrderValue: number | undefined;
    minimumTimeOnSite: number | undefined;
    minimumPageViews: number | undefined;
    conversionSpikeAlert: boolean;
    velocityThreshold: number | undefined;
    cookieTamperDetection: boolean;
    affiliateBlacklist: (string | undefined)[] | undefined;
    customValidation: string | undefined;
}, Yup.AnyObject, {
    conversionDelay: undefined;
    conversionWindow: 604800;
    ipRestriction: "none";
    deviceFingerprintChecks: false;
    proxyVpnDetection: false;
    duplicateEmailPhoneBlock: false;
    kycVerifiedOnly: false;
    geoTargeting: "";
    geoBlacklist: "";
    minimumOrderValue: undefined;
    maximumOrderValue: undefined;
    minimumTimeOnSite: undefined;
    minimumPageViews: undefined;
    conversionSpikeAlert: false;
    velocityThreshold: undefined;
    cookieTamperDetection: false;
    affiliateBlacklist: "";
    customValidation: undefined;
}, "">;
export declare const commissionRuleSchema: Yup.ObjectSchema<{
    type: NonNullable<"click" | "visit" | "signup" | "purchase" | "custom" | undefined>;
    payout: {
        baseField?: string | undefined;
        minPayout?: number | undefined;
        maxPayout?: number | undefined;
        amount: number;
        isPercentage: NonNullable<boolean | undefined>;
        currency: string;
    };
    validationMethod: "auto" | "manual" | "webhook";
    fraudDetection: {
        conversionDelay?: number | undefined;
        geoTargeting?: (string | undefined)[] | undefined;
        geoBlacklist?: (string | undefined)[] | undefined;
        minimumOrderValue?: number | undefined;
        maximumOrderValue?: number | undefined;
        minimumTimeOnSite?: number | undefined;
        minimumPageViews?: number | undefined;
        velocityThreshold?: number | undefined;
        affiliateBlacklist?: (string | undefined)[] | undefined;
        customValidation?: string | undefined;
        conversionWindow: number;
        ipRestriction: "none" | "unique-per-conversion" | "unique-per-day";
        deviceFingerprintChecks: boolean;
        proxyVpnDetection: boolean;
        duplicateEmailPhoneBlock: boolean;
        kycVerifiedOnly: boolean;
        conversionSpikeAlert: boolean;
        cookieTamperDetection: boolean;
    };
}, Yup.AnyObject, {
    type: undefined;
    payout: {
        amount: undefined;
        isPercentage: undefined;
        currency: "USD";
        baseField: undefined;
        minPayout: undefined;
        maxPayout: undefined;
    };
    validationMethod: "auto";
    fraudDetection: {
        conversionDelay: undefined;
        conversionWindow: 604800;
        ipRestriction: "none";
        deviceFingerprintChecks: false;
        proxyVpnDetection: false;
        duplicateEmailPhoneBlock: false;
        kycVerifiedOnly: false;
        geoTargeting: "";
        geoBlacklist: "";
        minimumOrderValue: undefined;
        maximumOrderValue: undefined;
        minimumTimeOnSite: undefined;
        minimumPageViews: undefined;
        conversionSpikeAlert: false;
        velocityThreshold: undefined;
        cookieTamperDetection: false;
        affiliateBlacklist: "";
        customValidation: undefined;
    };
}, "">;
export declare const trackEventRequestSchema: Yup.ObjectSchema<{
    type: NonNullable<"click" | "visit" | "signup" | "purchase" | "custom" | undefined>;
    organizationId: string;
    campaignId: string;
    affiliateId: string;
    userId: string | undefined;
    email: string | undefined;
    phone: string | undefined;
    metadata: {} | undefined;
    orderId: string | undefined;
    amount: number | undefined;
    currency: string | undefined;
    customEventName: string | undefined;
    context: {
        referrer?: string | undefined;
        title?: string | undefined;
        utmSource?: string | undefined;
        utmMedium?: string | undefined;
        utmCampaign?: string | undefined;
        utmTerm?: string | undefined;
        utmContent?: string | undefined;
        language?: string | undefined;
        screenResolution?: string | undefined;
        deviceFingerprint?: string | undefined;
        country?: string | undefined;
        region?: string | undefined;
        city?: string | undefined;
        timezone?: string | undefined;
        url: string;
        userAgent: string;
        ip: string;
        timestamp: number;
    } | undefined;
    sessionId: string | undefined;
    clickId: string | undefined;
    visitorId: string | undefined;
}, Yup.AnyObject, {
    type: undefined;
    organizationId: undefined;
    campaignId: undefined;
    affiliateId: undefined;
    userId: undefined;
    email: undefined;
    phone: undefined;
    metadata: {};
    orderId: undefined;
    amount: undefined;
    currency: undefined;
    customEventName: undefined;
    context: {
        url: undefined;
        referrer: undefined;
        title: undefined;
        utmSource: undefined;
        utmMedium: undefined;
        utmCampaign: undefined;
        utmTerm: undefined;
        utmContent: undefined;
        userAgent: undefined;
        ip: undefined;
        language: undefined;
        screenResolution: undefined;
        deviceFingerprint: undefined;
        country: undefined;
        region: undefined;
        city: undefined;
        timestamp: undefined;
        timezone: undefined;
    };
    sessionId: undefined;
    clickId: undefined;
    visitorId: undefined;
}, "">;
export declare const validateConversionRequestSchema: Yup.ObjectSchema<{
    eventId: string;
    organizationId: string;
    approved: boolean | undefined;
    rejectionReason: string | undefined;
}, Yup.AnyObject, {
    eventId: undefined;
    organizationId: undefined;
    approved: undefined;
    rejectionReason: undefined;
}, "">;
export declare const sdkConfigSchema: Yup.ObjectSchema<{
    organizationKey: string;
    apiEndpoint: string | undefined;
    cookieDomain: string | undefined;
    cookiePath: string;
    cookieTTL: number;
    attributionModel: "first-click" | "last-click" | "linear" | "time-decay";
    conversionWindow: number;
    autoTrackPageViews: boolean;
    autoTrackClicks: boolean;
    captureUtmParams: boolean;
    respectDoNotTrack: boolean;
    anonymizeIp: boolean;
    batchEvents: boolean;
    batchSize: number;
    batchInterval: number;
    offlineQueue: boolean;
    debug: boolean;
}, Yup.AnyObject, {
    organizationKey: undefined;
    apiEndpoint: undefined;
    cookieDomain: undefined;
    cookiePath: "/";
    cookieTTL: 604800;
    attributionModel: "last-click";
    conversionWindow: 604800;
    autoTrackPageViews: true;
    autoTrackClicks: true;
    captureUtmParams: true;
    respectDoNotTrack: true;
    anonymizeIp: false;
    batchEvents: false;
    batchSize: 10;
    batchInterval: 5000;
    offlineQueue: true;
    debug: false;
}, "">;
export declare const dateRangeSchema: Yup.ObjectSchema<{
    start: string;
    end: string;
}, Yup.AnyObject, {
    start: undefined;
    end: undefined;
}, "">;
export declare const affiliatePerformanceQuerySchema: Yup.ObjectSchema<{
    affiliateId: string;
    campaignId: string | undefined;
    period: {
        start: string;
        end: string;
    };
}, Yup.AnyObject, {
    affiliateId: undefined;
    campaignId: undefined;
    period: {
        start: undefined;
        end: undefined;
    };
}, "">;
export declare const campaignInsightsQuerySchema: Yup.ObjectSchema<{
    campaignId: string;
    organizationId: string;
    period: {
        start: string;
        end: string;
    };
    groupBy: "day" | "week" | "month";
}, Yup.AnyObject, {
    campaignId: undefined;
    organizationId: undefined;
    period: {
        start: undefined;
        end: undefined;
    };
    groupBy: "day";
}, "">;
export declare const postbackConfigSchema: Yup.ObjectSchema<{
    url: string;
    method: "GET" | "POST";
    headers: {} | undefined;
    params: {} | undefined;
    retryAttempts: number;
    retryDelay: number;
}, Yup.AnyObject, {
    url: undefined;
    method: "POST";
    headers: {};
    params: {};
    retryAttempts: 3;
    retryDelay: 1000;
}, "">;
export declare function validateSchema<T>(schema: Yup.Schema<T>, data: unknown): Promise<T>;
export declare function validateSchemaSync<T>(schema: Yup.Schema<T>, data: unknown): T;
//# sourceMappingURL=schemas.d.ts.map