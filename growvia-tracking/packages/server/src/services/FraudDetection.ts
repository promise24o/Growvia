/**
 * Fraud Detection Service
 * Implements fraud detection rules from commission models
 */

import type { FraudDetectionConfig, TrackingEvent, EventContext } from '@growvia/shared';
import { isWithinWindow, isPrivateIp } from '@growvia/shared';
import { AttributionCache } from '../redis/AttributionCache';
import { TrackingEvent as TrackingEventModel } from '../models/TrackingEvent';
import { SessionTracking } from '../models/SessionTracking';

export interface FraudCheckResult {
  passed: boolean;
  flags: string[];
  rejectionReason?: string;
}

export class FraudDetection {
  constructor(private cache: AttributionCache) {}

  /**
   * Run all fraud detection checks
   */
  async checkEvent(
    event: Partial<TrackingEvent>,
    config: FraudDetectionConfig,
    clickTimestamp?: number
  ): Promise<FraudCheckResult> {
    const flags: string[] = [];

    // 1. Conversion Delay Check
    if (config.conversionDelay && clickTimestamp) {
      const minDelay = config.conversionDelay * 24 * 60 * 60 * 1000; // days to ms
      const actualDelay = Date.now() - clickTimestamp;
      
      if (actualDelay < minDelay) {
        flags.push(`conversion_too_fast:${Math.floor(actualDelay / 1000)}s`);
      }
    }

    // 2. IP Restriction Check
    if (config.ipRestriction && event.context?.ip) {
      const ipBlocked = await this.checkIpRestriction(
        event.context.ip,
        event.affiliateId!,
        config.ipRestriction
      );
      
      if (ipBlocked) {
        flags.push('ip_restriction_violated');
      }
    }

    // 3. Device Fingerprint Check
    if (config.deviceFingerprintChecks && event.context?.deviceFingerprint) {
      const fingerprintIssue = await this.checkDeviceFingerprint(
        event.context.deviceFingerprint,
        event.campaignId!,
        event.type!
      );
      
      if (fingerprintIssue) {
        flags.push('suspicious_device_fingerprint');
      }
    }

    // 4. Duplicate Email/Phone Check
    if (config.duplicateEmailPhoneBlock) {
      if (event.email) {
        const isDuplicate = await this.cache.checkDuplicateUser(
          event.email,
          event.campaignId!,
          'email'
        );
        
        if (isDuplicate) {
          flags.push('duplicate_email');
        }
      }
      
      if (event.phone) {
        const isDuplicate = await this.cache.checkDuplicateUser(
          event.phone,
          event.campaignId!,
          'phone'
        );
        
        if (isDuplicate) {
          flags.push('duplicate_phone');
        }
      }
    }

    // 5. Geo Targeting Check
    if (config.geoTargeting && config.geoTargeting.length > 0 && event.context?.country) {
      if (!config.geoTargeting.includes(event.context.country)) {
        flags.push(`geo_not_targeted:${event.context.country}`);
      }
    }

    // 6. Geo Blacklist Check
    if (config.geoBlacklist && config.geoBlacklist.length > 0 && event.context?.country) {
      if (config.geoBlacklist.includes(event.context.country)) {
        flags.push(`geo_blacklisted:${event.context.country}`);
      }
    }

    // 7. Minimum Order Value Check (for purchases)
    if (config.minimumOrderValue && event.type === 'purchase' && event.amount) {
      if (event.amount < config.minimumOrderValue) {
        flags.push(`order_value_too_low:${event.amount}`);
      }
    }

    // 8. Maximum Order Value Check (for purchases)
    if (config.maximumOrderValue && event.type === 'purchase' && event.amount) {
      if (event.amount > config.maximumOrderValue) {
        flags.push(`order_value_too_high:${event.amount}`);
      }
    }

    // 9. Minimum Time on Site Check
    if (config.minimumTimeOnSite && event.sessionId) {
      const session = await SessionTracking.findOne({ sessionId: event.sessionId });
      
      if (session && session.duration < config.minimumTimeOnSite) {
        flags.push(`time_on_site_too_low:${session.duration}s`);
      }
    }

    // 10. Minimum Page Views Check
    if (config.minimumPageViews && event.sessionId) {
      const session = await SessionTracking.findOne({ sessionId: event.sessionId });
      
      if (session && session.pageViews < config.minimumPageViews) {
        flags.push(`page_views_too_low:${session.pageViews}`);
      }
    }

    // 11. Conversion Spike Alert
    if (config.conversionSpikeAlert && config.velocityThreshold) {
      const spikeDetected = await this.cache.checkConversionVelocity(
        event.affiliateId!,
        config.velocityThreshold
      );
      
      if (spikeDetected) {
        flags.push('conversion_spike_detected');
      }
    }

    // 12. Proxy/VPN Detection (basic check)
    if (config.proxyVpnDetection && event.context?.ip) {
      if (isPrivateIp(event.context.ip)) {
        flags.push('private_ip_detected');
      }
    }

    // 13. Cookie Tamper Detection
    if (config.cookieTamperDetection && event.clickId) {
      const tampered = await this.checkCookieTampering(event.clickId, event.context!);
      
      if (tampered) {
        flags.push('cookie_tampering_detected');
      }
    }

    // Determine if event passed
    const criticalFlags = [
      'ip_restriction_violated',
      'duplicate_email',
      'duplicate_phone',
      'geo_blacklisted',
      'cookie_tampering_detected',
    ];

    const hasCriticalFlag = flags.some(flag => 
      criticalFlags.some(critical => flag.startsWith(critical))
    );

    return {
      passed: !hasCriticalFlag,
      flags,
      rejectionReason: hasCriticalFlag ? flags[0] : undefined,
    };
  }

  /**
   * Check IP restriction
   */
  private async checkIpRestriction(
    ip: string,
    affiliateId: string,
    restriction: string
  ): Promise<boolean> {
    if (restriction === 'unique-per-conversion') {
      return await this.cache.checkIpRateLimit(ip, affiliateId, 86400); // 24 hours
    } else if (restriction === 'unique-per-day') {
      return await this.cache.checkIpRateLimit(ip, affiliateId, 86400);
    }
    
    return false;
  }

  /**
   * Check device fingerprint for suspicious patterns
   */
  private async checkDeviceFingerprint(
    fingerprint: string,
    campaignId: string,
    eventType: string
  ): Promise<boolean> {
    // Check if this fingerprint has too many conversions
    const count = await TrackingEventModel.countDocuments({
      campaignId,
      type: eventType,
      'context.deviceFingerprint': fingerprint,
      status: { $in: ['validated', 'pending'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // last 24h
    });

    // Flag if more than 5 conversions from same fingerprint in 24h
    return count > 5;
  }

  /**
   * Check for cookie tampering
   */
  private async checkCookieTampering(
    clickId: string,
    context: EventContext
  ): Promise<boolean> {
    const click = await this.cache.getClick(clickId);
    
    if (!click) return true; // Click not found = suspicious
    
    // Check if device fingerprint matches
    if (click.context.deviceFingerprint && context.deviceFingerprint) {
      if (click.context.deviceFingerprint !== context.deviceFingerprint) {
        return true;
      }
    }
    
    // Check if user agent matches
    if (click.context.userAgent !== context.userAgent) {
      return true;
    }
    
    return false;
  }

  /**
   * Mark user as converted (for duplicate prevention)
   */
  async markUserConverted(
    email: string | undefined,
    phone: string | undefined,
    campaignId: string
  ): Promise<void> {
    if (email) {
      await this.cache.markUserConverted(email, campaignId, 'email');
    }
    
    if (phone) {
      await this.cache.markUserConverted(phone, campaignId, 'phone');
    }
  }

  /**
   * Check if affiliate is blacklisted
   */
  async isAffiliateBlacklisted(
    affiliateId: string,
    blacklist: string[] | undefined
  ): Promise<boolean> {
    if (!blacklist || blacklist.length === 0) return false;
    return blacklist.includes(affiliateId);
  }
}
