/**
 * Cookie Manager for Growvia SDK
 */

import { COOKIE_NAMES, serializeCookie, parseCookie } from '@growvia/shared';
import type { CookieOptions } from '@growvia/shared';

export class CookieManager {
  private domain?: string;
  private path: string;
  private maxAge: number;
  private secure: boolean;
  private sameSite: 'strict' | 'lax' | 'none';

  constructor(options: {
    domain?: string;
    path?: string;
    maxAge?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}) {
    this.domain = options.domain;
    this.path = options.path || '/';
    this.maxAge = options.maxAge || 604800; // 7 days
    this.secure = options.secure ?? (typeof window !== 'undefined' && window.location.protocol === 'https:');
    this.sameSite = options.sameSite || 'lax';
  }

  /**
   * Set a cookie
   */
  set(name: string, value: string, customMaxAge?: number): void {
    if (typeof document === 'undefined') return;

    const options: CookieOptions = {
      domain: this.domain,
      path: this.path,
      maxAge: customMaxAge || this.maxAge,
      secure: this.secure,
      sameSite: this.sameSite,
    };

    document.cookie = serializeCookie(name, value, options);
  }

  /**
   * Get a cookie value
   */
  get(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = parseCookie(document.cookie);
    return cookies[name] || null;
  }

  /**
   * Delete a cookie
   */
  delete(name: string): void {
    if (typeof document === 'undefined') return;

    const options: CookieOptions = {
      domain: this.domain,
      path: this.path,
      maxAge: -1,
    };

    document.cookie = serializeCookie(name, '', options);
  }

  /**
   * Check if a cookie exists
   */
  has(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * Get attribution data from cookie
   */
  getAttributionData(): {
    clickId?: string;
    affiliateId?: string;
    campaignId?: string;
    timestamp?: number;
  } | null {
    const data = this.get(COOKIE_NAMES.ATTRIBUTION);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Set attribution data in cookie
   */
  setAttributionData(data: {
    clickId: string;
    affiliateId: string;
    campaignId: string;
    timestamp: number;
  }): void {
    this.set(COOKIE_NAMES.ATTRIBUTION, JSON.stringify(data));
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.get(COOKIE_NAMES.SESSION);
  }

  /**
   * Set session ID
   */
  setSessionId(sessionId: string): void {
    // Session cookie expires in 30 minutes
    this.set(COOKIE_NAMES.SESSION, sessionId, 1800);
  }

  /**
   * Get visitor ID
   */
  getVisitorId(): string | null {
    return this.get(COOKIE_NAMES.VISITOR);
  }

  /**
   * Set visitor ID
   */
  setVisitorId(visitorId: string): void {
    // Visitor cookie lasts 2 years
    this.set(COOKIE_NAMES.VISITOR, visitorId, 63072000);
  }

  /**
   * Clear all Growvia cookies
   */
  clearAll(): void {
    this.delete(COOKIE_NAMES.ATTRIBUTION);
    this.delete(COOKIE_NAMES.SESSION);
    this.delete(COOKIE_NAMES.VISITOR);
  }
}
