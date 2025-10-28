/**
 * Attribution Cache - Redis-based caching for click attribution
 */

import { RedisClient } from './RedisClient';
import type { ClickData } from '@growvia/shared';

const CLICK_PREFIX = 'click:';
const SESSION_PREFIX = 'session:';
const VISITOR_PREFIX = 'visitor:';
const RATE_LIMIT_PREFIX = 'rate:';

export class AttributionCache {
  constructor(private redis: RedisClient) {}

  /**
   * Store click data for attribution
   */
  async storeClick(clickData: ClickData): Promise<void> {
    const key = `${CLICK_PREFIX}${clickData.id}`;
    const ttl = Math.floor((clickData.expiresAt - Date.now()) / 1000);
    
    await this.redis.setJSON(key, clickData, ttl);
    
    // Also index by visitor and session for quick lookup
    await this.redis.sadd(
      `${VISITOR_PREFIX}${clickData.visitorId}:clicks`,
      clickData.id
    );
    await this.redis.expire(
      `${VISITOR_PREFIX}${clickData.visitorId}:clicks`,
      ttl
    );
    
    await this.redis.sadd(
      `${SESSION_PREFIX}${clickData.sessionId}:clicks`,
      clickData.id
    );
    await this.redis.expire(
      `${SESSION_PREFIX}${clickData.sessionId}:clicks`,
      ttl
    );
  }

  /**
   * Get click data by ID
   */
  async getClick(clickId: string): Promise<ClickData | null> {
    const key = `${CLICK_PREFIX}${clickId}`;
    return await this.redis.getJSON<ClickData>(key);
  }

  /**
   * Get all clicks for a visitor
   */
  async getVisitorClicks(visitorId: string): Promise<ClickData[]> {
    const clickIds = await this.redis.smembers(`${VISITOR_PREFIX}${visitorId}:clicks`);
    
    const clicks: ClickData[] = [];
    for (const clickId of clickIds) {
      const click = await this.getClick(clickId);
      if (click) clicks.push(click);
    }
    
    return clicks.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get all clicks for a session
   */
  async getSessionClicks(sessionId: string): Promise<ClickData[]> {
    const clickIds = await this.redis.smembers(`${SESSION_PREFIX}${sessionId}:clicks`);
    
    const clicks: ClickData[] = [];
    for (const clickId of clickIds) {
      const click = await this.getClick(clickId);
      if (click) clicks.push(click);
    }
    
    return clicks.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Mark click as converted
   */
  async markClickConverted(
    clickId: string,
    conversionId: string,
    conversionType: string
  ): Promise<void> {
    const click = await this.getClick(clickId);
    if (!click) return;
    
    click.converted = true;
    click.conversionId = conversionId;
    click.conversionType = conversionType;
    click.conversionTimestamp = Date.now();
    
    const key = `${CLICK_PREFIX}${clickId}`;
    const ttl = await this.redis.ttl(key);
    
    if (ttl > 0) {
      await this.redis.setJSON(key, click, ttl);
    }
  }

  /**
   * Check for duplicate click (rate limiting)
   */
  async isDuplicateClick(
    affiliateId: string,
    campaignId: string,
    visitorId: string,
    windowSeconds: number = 43200 // 12 hours
  ): Promise<boolean> {
    const key = `${RATE_LIMIT_PREFIX}click:${affiliateId}:${campaignId}:${visitorId}`;
    const exists = await this.redis.exists(key);
    
    if (exists) {
      return true;
    }
    
    // Set rate limit
    await this.redis.set(key, '1', windowSeconds);
    return false;
  }

  /**
   * Check IP-based rate limiting
   */
  async checkIpRateLimit(
    ip: string,
    affiliateId: string,
    windowSeconds: number = 43200 // 12 hours
  ): Promise<boolean> {
    const key = `${RATE_LIMIT_PREFIX}ip:${ip}:${affiliateId}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    
    // Allow only 1 conversion per IP per affiliate per window
    return count > 1;
  }

  /**
   * Check email/phone duplicate
   */
  async checkDuplicateUser(
    identifier: string, // email or phone
    campaignId: string,
    type: 'email' | 'phone'
  ): Promise<boolean> {
    const key = `${RATE_LIMIT_PREFIX}${type}:${campaignId}:${identifier}`;
    return await this.redis.exists(key);
  }

  /**
   * Mark email/phone as used
   */
  async markUserConverted(
    identifier: string,
    campaignId: string,
    type: 'email' | 'phone',
    ttl: number = 31536000 // 1 year
  ): Promise<void> {
    const key = `${RATE_LIMIT_PREFIX}${type}:${campaignId}:${identifier}`;
    await this.redis.set(key, '1', ttl);
  }

  /**
   * Check conversion velocity (spike detection)
   */
  async checkConversionVelocity(
    affiliateId: string,
    threshold: number,
    windowSeconds: number = 3600 // 1 hour
  ): Promise<boolean> {
    const key = `${RATE_LIMIT_PREFIX}velocity:${affiliateId}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    
    return count > threshold;
  }

  /**
   * Store session data
   */
  async storeSession(sessionId: string, data: any, ttl: number = 1800): Promise<void> {
    const key = `${SESSION_PREFIX}${sessionId}`;
    await this.redis.setJSON(key, data, ttl);
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<any | null> {
    const key = `${SESSION_PREFIX}${sessionId}`;
    return await this.redis.getJSON(key);
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const key = `${SESSION_PREFIX}${sessionId}`;
    const ttl = await this.redis.ttl(key);
    
    if (ttl > 0) {
      await this.redis.expire(key, 1800); // Reset to 30 minutes
    }
  }

  /**
   * Clear all attribution data (for testing)
   */
  async clearAll(): Promise<void> {
    // This should be used carefully, only in development
    const patterns = [CLICK_PREFIX, SESSION_PREFIX, VISITOR_PREFIX, RATE_LIMIT_PREFIX];
    
    for (const pattern of patterns) {
      const keys = await this.redis.getClient().keys(`${pattern}*`);
      if (keys.length > 0) {
        await this.redis.getClient().del(...keys);
      }
    }
  }
}
