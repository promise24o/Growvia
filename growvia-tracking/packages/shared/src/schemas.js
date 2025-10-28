"use strict";
/**
 * Growvia Tracking System - Validation Schemas
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.postbackConfigSchema = exports.campaignInsightsQuerySchema = exports.affiliatePerformanceQuerySchema = exports.dateRangeSchema = exports.sdkConfigSchema = exports.validateConversionRequestSchema = exports.trackEventRequestSchema = exports.commissionRuleSchema = exports.fraudDetectionConfigSchema = exports.payoutConfigSchema = exports.eventContextSchema = exports.validationMethodSchema = exports.attributionModelSchema = exports.eventTypeSchema = void 0;
exports.validateSchema = validateSchema;
exports.validateSchemaSync = validateSchemaSync;
const Yup = __importStar(require("yup"));
// ============================================================================
// Event Validation Schemas
// ============================================================================
exports.eventTypeSchema = Yup.string()
    .oneOf(['click', 'visit', 'signup', 'purchase', 'custom'])
    .required();
exports.attributionModelSchema = Yup.string()
    .oneOf(['first-click', 'last-click', 'linear', 'time-decay'])
    .default('last-click');
exports.validationMethodSchema = Yup.string()
    .oneOf(['auto', 'manual', 'webhook'])
    .default('auto');
// ============================================================================
// Context Schema
// ============================================================================
exports.eventContextSchema = Yup.object({
    url: Yup.string().url().required(),
    referrer: Yup.string().url().optional(),
    title: Yup.string().optional(),
    utmSource: Yup.string().optional(),
    utmMedium: Yup.string().optional(),
    utmCampaign: Yup.string().optional(),
    utmTerm: Yup.string().optional(),
    utmContent: Yup.string().optional(),
    userAgent: Yup.string().required(),
    ip: Yup.string().required(),
    language: Yup.string().optional(),
    screenResolution: Yup.string().optional(),
    deviceFingerprint: Yup.string().optional(),
    country: Yup.string().length(2).optional(),
    region: Yup.string().optional(),
    city: Yup.string().optional(),
    timestamp: Yup.number().required(),
    timezone: Yup.string().optional(),
});
// ============================================================================
// Commission & Payout Schemas
// ============================================================================
exports.payoutConfigSchema = Yup.object({
    amount: Yup.number().min(0).required(),
    isPercentage: Yup.boolean().required(),
    currency: Yup.string().length(3).default('USD'),
    baseField: Yup.string().optional(),
    minPayout: Yup.number().min(0).optional(),
    maxPayout: Yup.number().min(0).optional(),
}).test('max-greater-than-min', 'maxPayout must be greater than minPayout', function (value) {
    if (value.minPayout && value.maxPayout) {
        return value.maxPayout > value.minPayout;
    }
    return true;
});
exports.fraudDetectionConfigSchema = Yup.object({
    conversionDelay: Yup.number().min(0).optional(),
    conversionWindow: Yup.number().min(0).default(604800), // 7 days
    ipRestriction: Yup.string()
        .oneOf(['none', 'unique-per-conversion', 'unique-per-day'])
        .default('none'),
    deviceFingerprintChecks: Yup.boolean().default(false),
    proxyVpnDetection: Yup.boolean().default(false),
    duplicateEmailPhoneBlock: Yup.boolean().default(false),
    kycVerifiedOnly: Yup.boolean().default(false),
    geoTargeting: Yup.array().of(Yup.string().length(2)).optional(),
    geoBlacklist: Yup.array().of(Yup.string().length(2)).optional(),
    minimumOrderValue: Yup.number().min(0).optional(),
    maximumOrderValue: Yup.number().min(0).optional(),
    minimumTimeOnSite: Yup.number().min(0).optional(),
    minimumPageViews: Yup.number().min(0).optional(),
    conversionSpikeAlert: Yup.boolean().default(false),
    velocityThreshold: Yup.number().min(0).optional(),
    cookieTamperDetection: Yup.boolean().default(false),
    affiliateBlacklist: Yup.array().of(Yup.string()).optional(),
    customValidation: Yup.string().url().optional(),
});
exports.commissionRuleSchema = Yup.object({
    type: exports.eventTypeSchema,
    payout: exports.payoutConfigSchema.required(),
    validationMethod: exports.validationMethodSchema,
    fraudDetection: exports.fraudDetectionConfigSchema.required(),
});
// ============================================================================
// Track Event Request Schema
// ============================================================================
exports.trackEventRequestSchema = Yup.object({
    type: exports.eventTypeSchema,
    organizationId: Yup.string().required(),
    campaignId: Yup.string().required(),
    affiliateId: Yup.string().required(),
    userId: Yup.string().optional(),
    email: Yup.string().email().optional(),
    phone: Yup.string().optional(),
    metadata: Yup.object().optional(),
    orderId: Yup.string().when('type', {
        is: 'purchase',
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
    }),
    amount: Yup.number().min(0).when('type', {
        is: 'purchase',
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
    }),
    currency: Yup.string().length(3).when('type', {
        is: 'purchase',
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
    }),
    customEventName: Yup.string().when('type', {
        is: 'custom',
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
    }),
    context: exports.eventContextSchema.optional(),
    sessionId: Yup.string().optional(),
    clickId: Yup.string().optional(),
    visitorId: Yup.string().optional(),
});
// ============================================================================
// Validate Conversion Request Schema
// ============================================================================
exports.validateConversionRequestSchema = Yup.object({
    eventId: Yup.string().required(),
    organizationId: Yup.string().required(),
    approved: Yup.boolean().optional(),
    rejectionReason: Yup.string().when('approved', {
        is: false,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
    }),
});
// ============================================================================
// SDK Config Schema
// ============================================================================
exports.sdkConfigSchema = Yup.object({
    organizationKey: Yup.string().required(),
    apiEndpoint: Yup.string().url().optional(),
    cookieDomain: Yup.string().optional(),
    cookiePath: Yup.string().default('/'),
    cookieTTL: Yup.number().min(0).default(604800), // 7 days
    attributionModel: exports.attributionModelSchema,
    conversionWindow: Yup.number().min(0).default(604800),
    autoTrackPageViews: Yup.boolean().default(true),
    autoTrackClicks: Yup.boolean().default(true),
    captureUtmParams: Yup.boolean().default(true),
    respectDoNotTrack: Yup.boolean().default(true),
    anonymizeIp: Yup.boolean().default(false),
    batchEvents: Yup.boolean().default(false),
    batchSize: Yup.number().min(1).max(100).default(10),
    batchInterval: Yup.number().min(100).default(5000),
    offlineQueue: Yup.boolean().default(true),
    debug: Yup.boolean().default(false),
});
// ============================================================================
// Analytics Query Schemas
// ============================================================================
exports.dateRangeSchema = Yup.object({
    start: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/).required(),
    end: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/).required(),
}).test('end-after-start', 'end date must be after start date', function (value) {
    return new Date(value.end) >= new Date(value.start);
});
exports.affiliatePerformanceQuerySchema = Yup.object({
    affiliateId: Yup.string().required(),
    campaignId: Yup.string().optional(),
    period: exports.dateRangeSchema.required(),
});
exports.campaignInsightsQuerySchema = Yup.object({
    campaignId: Yup.string().required(),
    organizationId: Yup.string().required(),
    period: exports.dateRangeSchema.required(),
    groupBy: Yup.string().oneOf(['day', 'week', 'month']).default('day'),
});
// ============================================================================
// Webhook & Postback Schemas
// ============================================================================
exports.postbackConfigSchema = Yup.object({
    url: Yup.string().url().required(),
    method: Yup.string().oneOf(['GET', 'POST']).default('POST'),
    headers: Yup.object().optional(),
    params: Yup.object().optional(),
    retryAttempts: Yup.number().min(0).max(10).default(3),
    retryDelay: Yup.number().min(0).default(1000),
});
// ============================================================================
// Helper Functions
// ============================================================================
async function validateSchema(schema, data) {
    try {
        return await schema.validate(data, { abortEarly: false, stripUnknown: true });
    }
    catch (error) {
        if (error instanceof Yup.ValidationError) {
            throw new Error(`Validation failed: ${error.errors.join(', ')}`);
        }
        throw error;
    }
}
function validateSchemaSync(schema, data) {
    try {
        return schema.validateSync(data, { abortEarly: false, stripUnknown: true });
    }
    catch (error) {
        if (error instanceof Yup.ValidationError) {
            throw new Error(`Validation failed: ${error.errors.join(', ')}`);
        }
        throw error;
    }
}
//# sourceMappingURL=schemas.js.map