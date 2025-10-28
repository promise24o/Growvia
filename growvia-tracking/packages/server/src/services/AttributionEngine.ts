/**
 * Attribution Engine - Handles click-to-conversion attribution
 */

import type { AttributionModel, ClickData, Touchpoint, AttributionData } from '@growvia/shared';
import { calculateAttribution } from '@growvia/shared';
import { AttributionCache } from '../redis/AttributionCache';
import { ClickTracking } from '../models/ClickTracking';

export class AttributionEngine {
  constructor(private cache: AttributionCache) {}

  /**
   * Attribute a conversion to affiliate(s)
   */
  async attributeConversion(
    visitorId: string,
    sessionId: string,
    clickId: string | undefined,
    model: AttributionModel = 'last-click',
    conversionWindow: number = 604800 // 7 days in seconds
  ): Promise<AttributionData | null> {
    // Get all touchpoints for this visitor
    const touchpoints = await this.getTouchpoints(visitorId, sessionId, clickId, conversionWindow);
    
    if (touchpoints.length === 0) {
      return null;
    }

    // Calculate attribution weights
    const attribution = calculateAttribution(touchpoints, model);
    
    // For now, we'll use the primary attributed affiliate
    // (the one with the highest weight)
    let primaryAffiliateId = '';
    let maxWeight = 0;
    
    attribution.forEach((weight, affiliateId) => {
      if (weight > maxWeight) {
        maxWeight = weight;
        primaryAffiliateId = affiliateId;
      }
    });

    return {
      model,
      touchpoints,
      attributedAffiliateId: primaryAffiliateId,
      attributionWeight: maxWeight,
      conversionWindow,
    };
  }

  /**
   * Get all touchpoints (clicks) for attribution
   */
  private async getTouchpoints(
    visitorId: string,
    sessionId: string,
    clickId: string | undefined,
    conversionWindow: number
  ): Promise<Touchpoint[]> {
    const touchpoints: Touchpoint[] = [];
    const now = Date.now();
    const windowStart = now - (conversionWindow * 1000);

    // Try to get from cache first
    let clicks: ClickData[] = [];
    
    if (clickId) {
      // Specific click provided
      const click = await this.cache.getClick(clickId);
      if (click && click.timestamp >= windowStart) {
        clicks = [click];
      }
    } else {
      // Get all clicks for this visitor/session
      const visitorClicks = await this.cache.getVisitorClicks(visitorId);
      const sessionClicks = await this.cache.getSessionClicks(sessionId);
      
      // Combine and deduplicate
      const allClicks = [...visitorClicks, ...sessionClicks];
      const uniqueClicks = new Map<string, ClickData>();
      
      allClicks.forEach(click => {
        if (click.timestamp >= windowStart && !click.converted) {
          uniqueClicks.set(click.id, click);
        }
      });
      
      clicks = Array.from(uniqueClicks.values());
    }

    // If not in cache, try database
    if (clicks.length === 0) {
      const dbClicks = await ClickTracking.find({
        $or: [{ visitorId }, { sessionId }],
        timestamp: { $gte: new Date(windowStart) },
        converted: false,
      }).sort({ timestamp: 1 });

      clicks = dbClicks.map(click => ({
        id: click.clickId,
        timestamp: click.timestamp.getTime(),
        affiliateId: click.affiliateId.toString(),
        campaignId: click.campaignId.toString(),
        organizationId: click.organizationId.toString(),
        sessionId: click.sessionId,
        visitorId: click.visitorId,
        context: click.context as any,
        expiresAt: click.expiresAt.getTime(),
        converted: click.converted,
        conversionId: click.conversionId,
        conversionType: click.conversionType,
        conversionTimestamp: click.conversionTimestamp?.getTime(),
      }));
    }

    // Convert to touchpoints
    clicks.forEach(click => {
      touchpoints.push({
        affiliateId: click.affiliateId,
        campaignId: click.campaignId,
        timestamp: click.timestamp,
        type: 'click',
      });
    });

    return touchpoints;
  }

  /**
   * Mark clicks as converted
   */
  async markConverted(
    clickIds: string[],
    conversionId: string,
    conversionType: string
  ): Promise<void> {
    // Update cache
    for (const clickId of clickIds) {
      await this.cache.markClickConverted(clickId, conversionId, conversionType);
    }

    // Update database
    await ClickTracking.updateMany(
      { clickId: { $in: clickIds } },
      {
        $set: {
          converted: true,
          conversionId,
          conversionType,
          conversionTimestamp: new Date(),
        },
      }
    );
  }

  /**
   * Get attribution summary for an affiliate
   */
  async getAffiliateSummary(
    affiliateId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalClicks: number;
    convertedClicks: number;
    conversionRate: number;
  }> {
    const totalClicks = await ClickTracking.countDocuments({
      affiliateId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const convertedClicks = await ClickTracking.countDocuments({
      affiliateId,
      timestamp: { $gte: startDate, $lte: endDate },
      converted: true,
    });

    const conversionRate = totalClicks > 0 ? (convertedClicks / totalClicks) * 100 : 0;

    return {
      totalClicks,
      convertedClicks,
      conversionRate,
    };
  }
}
