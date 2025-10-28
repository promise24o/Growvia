/**
 * Tracking Controller - Handles event tracking endpoints
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  TrackingEvent,
  ClickTracking,
  SessionTracking,
  AttributionEngine,
  FraudDetection,
  AttributionCache,
  getRedisClient,
} from '@growvia/server';
import {
  generateEventId,
  generateClickId,
  trackEventRequestSchema,
  validateSchema,
  addSeconds,
  anonymizeIp,
  type TrackEventRequest,
  type EventType,
} from '@growvia/shared';
import * as geoip from 'geoip-lite';

// Initialize services
const redis = getRedisClient();
const cache = new AttributionCache(redis);
const attributionEngine = new AttributionEngine(cache);
const fraudDetection = new FraudDetection(cache);

/**
 * Track a single event
 */
export async function trackEvent(req: Request, res: Response) {
  try {
    // Validate request
    const data = await validateSchema(trackEventRequestSchema, req.body) as TrackEventRequest;

    // Enrich context with server-side data
    const context: any = {
      ...data.context,
      ip: req.ip || req.connection.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      timestamp: Date.now(),
    };

    // Add geo data
    const geo = geoip.lookup(context.ip);
    if (geo) {
      context.country = geo.country;
      context.region = geo.region;
      context.city = geo.city;
    }

    // Anonymize IP if needed
    if (req.query.anonymizeIp === 'true') {
      context.ip = anonymizeIp(context.ip);
    }

    // Handle click events
    if (data.type === 'click') {
      const clickId = data.clickId || generateClickId();
      const conversionWindow = parseInt(process.env.DEFAULT_CONVERSION_WINDOW || '604800');
      
      // Check for duplicate click
      const isDuplicate = await cache.isDuplicateClick(
        data.affiliateId,
        data.campaignId,
        data.visitorId!,
        43200 // 12 hours
      );

      if (isDuplicate) {
        return res.status(200).json({
          success: true,
          eventId: 'duplicate',
          message: 'Duplicate click ignored',
        });
      }

      // Store click in cache and database
      const clickData = {
        id: clickId,
        timestamp: Date.now(),
        affiliateId: data.affiliateId,
        campaignId: data.campaignId,
        organizationId: data.organizationId,
        sessionId: data.sessionId!,
        visitorId: data.visitorId!,
        context,
        expiresAt: addSeconds(Date.now(), conversionWindow),
        converted: false,
      };

      await cache.storeClick(clickData);

      await ClickTracking.create({
        clickId,
        timestamp: new Date(clickData.timestamp),
        affiliateId: new mongoose.Types.ObjectId(data.affiliateId),
        campaignId: new mongoose.Types.ObjectId(data.campaignId),
        organizationId: new mongoose.Types.ObjectId(data.organizationId),
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        context,
        expiresAt: new Date(clickData.expiresAt),
        converted: false,
      });

      return res.status(200).json({
        success: true,
        eventId: clickId,
        message: 'Click tracked',
      });
    }

    // Handle conversion events (visit, signup, purchase, custom)
    const eventId = generateEventId();

    // Get attribution data
    const attribution = await attributionEngine.attributeConversion(
      data.visitorId!,
      data.sessionId!,
      data.clickId,
      process.env.DEFAULT_ATTRIBUTION_MODEL as any || 'last-click',
      parseInt(process.env.DEFAULT_CONVERSION_WINDOW || '604800')
    );

    if (!attribution) {
      return res.status(400).json({
        success: false,
        error: 'No attribution found',
        message: 'Could not attribute this conversion to any click',
      });
    }

    // Get commission model for fraud detection
    // In a real implementation, you would fetch this from the database
    const commissionModel = await getCommissionModel(data.campaignId, data.type);

    if (!commissionModel) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign or event type',
      });
    }

    // Run fraud detection
    const clickTimestamp = attribution.touchpoints[0]?.timestamp;
    const fraudCheck = await fraudDetection.checkEvent(
      {
        ...data,
        type: data.type as EventType,
        context,
        affiliateId: attribution.attributedAffiliateId,
      },
      commissionModel.fraudDetection,
      clickTimestamp
    );

    // Calculate payout
    let payout = 0;
    if (fraudCheck.passed) {
      payout = calculatePayout(commissionModel.payout, data.amount);
    }

    // Create tracking event
    const event = await TrackingEvent.create({
      eventId,
      type: data.type,
      timestamp: new Date(),
      organizationId: new mongoose.Types.ObjectId(data.organizationId),
      campaignId: new mongoose.Types.ObjectId(data.campaignId),
      affiliateId: new mongoose.Types.ObjectId(attribution.attributedAffiliateId),
      sessionId: data.sessionId,
      clickId: data.clickId,
      visitorId: data.visitorId,
      userId: data.userId,
      email: data.email,
      phone: data.phone,
      metadata: data.metadata,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
      customEventName: data.customEventName,
      context,
      attribution: {
        model: attribution.model,
        attributedAffiliateId: new mongoose.Types.ObjectId(attribution.attributedAffiliateId),
        attributionWeight: attribution.attributionWeight,
        conversionWindow: attribution.conversionWindow,
      },
      status: fraudCheck.passed ? 'pending' : 'fraud',
      rejectionReason: fraudCheck.rejectionReason,
      fraudFlags: fraudCheck.flags,
      payout: fraudCheck.passed ? payout : 0,
      payoutCurrency: commissionModel.payout.currency,
      payoutStatus: fraudCheck.passed ? 'pending' : undefined,
    });

    // Mark clicks as converted
    if (fraudCheck.passed) {
      const clickIds = attribution.touchpoints.map(tp => tp.affiliateId);
      await attributionEngine.markConverted(clickIds, eventId, data.type);

      // Mark user as converted for duplicate prevention
      await fraudDetection.markUserConverted(data.email, data.phone, data.campaignId);

      // Update affiliate performance metrics (in CampaignAffiliate model)
      await updateAffiliateMetrics(attribution.attributedAffiliateId, data.type, payout, data.amount);
    }

    // Update session
    await updateSession(data.sessionId!, eventId);

    return res.status(200).json({
      success: true,
      eventId,
      attributed: true,
      attributedAffiliateId: attribution.attributedAffiliateId,
      validated: fraudCheck.passed,
      fraudFlags: fraudCheck.flags,
      payout: fraudCheck.passed ? payout : 0,
    });
  } catch (error: any) {
    console.error('Track event error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to track event',
    });
  }
}

/**
 * Track batch of events
 */
export async function trackBatchEvents(req: Request, res: Response) {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Events array is required',
      });
    }

    const results = [];

    for (const eventData of events) {
      try {
        // Process each event (simplified version)
        const data = await validateSchema(trackEventRequestSchema, eventData);
        // ... process event similar to trackEvent
        results.push({ success: true, eventId: generateEventId() });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to track batch events',
    });
  }
}

/**
 * Helper: Get commission model
 */
async function getCommissionModel(campaignId: string, eventType: string) {
  // This should fetch from your existing Commission model
  // For now, returning a mock
  return {
    payout: {
      amount: 100,
      isPercentage: false,
      currency: 'NGN',
    },
    fraudDetection: {
      conversionDelay: 0,
      ipRestriction: 'none' as const,
      deviceFingerprintChecks: true,
      duplicateEmailPhoneBlock: true,
      geoTargeting: undefined,
      minimumOrderValue: undefined,
      conversionSpikeAlert: true,
      velocityThreshold: 10,
      cookieTamperDetection: true,
      affiliateBlacklist: [],
      kycVerifiedOnly: false,
    },
  };
}

/**
 * Helper: Calculate payout
 */
function calculatePayout(payoutConfig: any, amount?: number): number {
  if (payoutConfig.isPercentage && amount) {
    const payout = (amount * payoutConfig.amount) / 100;
    if (payoutConfig.minPayout && payout < payoutConfig.minPayout) {
      return payoutConfig.minPayout;
    }
    if (payoutConfig.maxPayout && payout > payoutConfig.maxPayout) {
      return payoutConfig.maxPayout;
    }
    return payout;
  }
  
  return payoutConfig.amount;
}

/**
 * Helper: Update affiliate metrics
 */
async function updateAffiliateMetrics(
  affiliateId: string,
  eventType: string,
  payout: number,
  revenue?: number
) {
  // This should update your CampaignAffiliate model
  // Increment conversions, totalCommission, totalRevenue
  const CampaignAffiliate = mongoose.model('CampaignAffiliate');
  
  await CampaignAffiliate.findByIdAndUpdate(affiliateId, {
    $inc: {
      conversions: 1,
      totalCommission: payout,
      totalRevenue: revenue || 0,
    },
  });
}

/**
 * Helper: Update session
 */
async function updateSession(sessionId: string, eventId: string) {
  await SessionTracking.findOneAndUpdate(
    { sessionId },
    {
      $set: { lastActivityTime: new Date() },
      $inc: { pageViews: 1 },
      $push: { events: eventId },
    },
    { upsert: true }
  );

  await cache.updateSessionActivity(sessionId);
}
