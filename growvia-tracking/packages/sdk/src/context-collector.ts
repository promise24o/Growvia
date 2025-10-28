/**
 * Context Collector - Gathers page and device context
 */

import type { EventContext } from '@growvia/shared';
import { generateDeviceFingerprint, extractUtmParams, extractAffiliateParams } from '@growvia/shared';

export class ContextCollector {
  /**
   * Collect full event context
   */
  collect(url?: string): Partial<EventContext> {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    
    return {
      url: currentUrl,
      referrer: this.getReferrer(),
      title: this.getPageTitle(),
      ...extractUtmParams(currentUrl),
      userAgent: this.getUserAgent(),
      ip: '', // Will be filled by server
      language: this.getLanguage(),
      screenResolution: this.getScreenResolution(),
      deviceFingerprint: this.getDeviceFingerprint(),
      timestamp: Date.now(),
      timezone: this.getTimezone(),
    };
  }

  /**
   * Get referrer
   */
  private getReferrer(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    return document.referrer || undefined;
  }

  /**
   * Get page title
   */
  private getPageTitle(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    return document.title || undefined;
  }

  /**
   * Get user agent
   */
  private getUserAgent(): string {
    if (typeof navigator === 'undefined') return '';
    return navigator.userAgent;
  }

  /**
   * Get browser language
   */
  private getLanguage(): string | undefined {
    if (typeof navigator === 'undefined') return undefined;
    return navigator.language || undefined;
  }

  /**
   * Get screen resolution
   */
  private getScreenResolution(): string | undefined {
    if (typeof window === 'undefined' || typeof screen === 'undefined') return undefined;
    return `${screen.width}x${screen.height}`;
  }

  /**
   * Get timezone
   */
  private getTimezone(): string | undefined {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  }

  /**
   * Generate device fingerprint
   */
  private getDeviceFingerprint(): string | undefined {
    try {
      const context = {
        userAgent: this.getUserAgent(),
        language: this.getLanguage(),
        screenResolution: this.getScreenResolution(),
        timezone: this.getTimezone(),
      };
      
      return generateDeviceFingerprint(context);
    } catch {
      return undefined;
    }
  }

  /**
   * Extract affiliate parameters from URL
   */
  extractAffiliateParams(url?: string): {
    affiliateId?: string;
    campaignId?: string;
    clickId?: string;
  } {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    return extractAffiliateParams(currentUrl);
  }

  /**
   * Check if Do Not Track is enabled
   */
  isDoNotTrackEnabled(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    const dnt = (navigator as any).doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
    return dnt === '1' || dnt === 'yes';
  }
}
