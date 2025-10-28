/**
 * Growvia Tracking System - Validation Schemas
 */

import * as Yup from 'yup';
import type { EventType, ValidationMethod, AttributionModel } from './types';

// ============================================================================
// Event Validation Schemas
// ============================================================================

export const eventTypeSchema = Yup.string()
  .oneOf(['click', 'visit', 'signup', 'purchase', 'custom'] as EventType[])
  .required();

export const attributionModelSchema = Yup.string()
  .oneOf(['first-click', 'last-click', 'linear', 'time-decay'] as AttributionModel[])
  .default('last-click');

export const validationMethodSchema = Yup.string()
  .oneOf(['auto', 'manual', 'webhook'] as ValidationMethod[])
  .default('auto');

// ============================================================================
// Context Schema
// ============================================================================

export const eventContextSchema = Yup.object({
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

export const payoutConfigSchema = Yup.object({
  amount: Yup.number().min(0).required(),
  isPercentage: Yup.boolean().required(),
  currency: Yup.string().length(3).default('USD'),
  baseField: Yup.string().optional(),
  minPayout: Yup.number().min(0).optional(),
  maxPayout: Yup.number().min(0).optional(),
}).test('max-greater-than-min', 'maxPayout must be greater than minPayout', function(value) {
  if (value.minPayout && value.maxPayout) {
    return value.maxPayout > value.minPayout;
  }
  return true;
});

export const fraudDetectionConfigSchema = Yup.object({
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

export const commissionRuleSchema = Yup.object({
  type: eventTypeSchema,
  payout: payoutConfigSchema.required(),
  validationMethod: validationMethodSchema,
  fraudDetection: fraudDetectionConfigSchema.required(),
});

// ============================================================================
// Track Event Request Schema
// ============================================================================

export const trackEventRequestSchema = Yup.object({
  type: eventTypeSchema,
  
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
  
  context: eventContextSchema.optional(),
  
  sessionId: Yup.string().optional(),
  clickId: Yup.string().optional(),
  visitorId: Yup.string().optional(),
});

// ============================================================================
// Validate Conversion Request Schema
// ============================================================================

export const validateConversionRequestSchema = Yup.object({
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

export const sdkConfigSchema = Yup.object({
  organizationKey: Yup.string().required(),
  apiEndpoint: Yup.string().url().optional(),
  
  cookieDomain: Yup.string().optional(),
  cookiePath: Yup.string().default('/'),
  cookieTTL: Yup.number().min(0).default(604800), // 7 days
  
  attributionModel: attributionModelSchema,
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

export const dateRangeSchema = Yup.object({
  start: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/).required(),
  end: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/).required(),
}).test('end-after-start', 'end date must be after start date', function(value) {
  return new Date(value.end) >= new Date(value.start);
});

export const affiliatePerformanceQuerySchema = Yup.object({
  affiliateId: Yup.string().required(),
  campaignId: Yup.string().optional(),
  period: dateRangeSchema.required(),
});

export const campaignInsightsQuerySchema = Yup.object({
  campaignId: Yup.string().required(),
  organizationId: Yup.string().required(),
  period: dateRangeSchema.required(),
  groupBy: Yup.string().oneOf(['day', 'week', 'month']).default('day'),
});

// ============================================================================
// Webhook & Postback Schemas
// ============================================================================

export const postbackConfigSchema = Yup.object({
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

export async function validateSchema<T>(
  schema: Yup.Schema<T>,
  data: unknown
): Promise<T> {
  try {
    return await schema.validate(data, { abortEarly: false, stripUnknown: true });
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      throw new Error(`Validation failed: ${error.errors.join(', ')}`);
    }
    throw error;
  }
}

export function validateSchemaSync<T>(
  schema: Yup.Schema<T>,
  data: unknown
): T {
  try {
    return schema.validateSync(data, { abortEarly: false, stripUnknown: true });
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      throw new Error(`Validation failed: ${error.errors.join(', ')}`);
    }
    throw error;
  }
}
