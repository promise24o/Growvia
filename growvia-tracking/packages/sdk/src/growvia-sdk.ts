/**
 * Growvia Tracking SDK - Main Class
 */

import type { SDKConfig, TrackEventRequest, TrackEventResponse, EventType } from '@growvia/shared';
import { generateSessionId, generateVisitorId, generateClickId, sdkConfigSchema, validateSchemaSync } from '@growvia/shared';
import { CookieManager } from './cookie-manager';
import { ContextCollector } from './context-collector';
import { EventQueue } from './event-queue';

export class GrowviaSDK {
  private config: SDKConfig;
  private cookieManager: CookieManager;
  private contextCollector: ContextCollector;
  private eventQueue: EventQueue;
  private sessionId: string;
  private visitorId: string;
  private batchTimer?: number;
  private initialized = false;

  constructor(config: Partial<SDKConfig>) {
    // Validate and merge config
    this.config = validateSchemaSync(sdkConfigSchema, {
      apiEndpoint: 'https://track.growvia.io',
      ...config,
    });

    // Initialize managers
    this.cookieManager = new CookieManager({
      domain: this.config.cookieDomain,
      path: this.config.cookiePath,
      maxAge: this.config.cookieTTL,
    });

    this.contextCollector = new ContextCollector();

    this.eventQueue = new EventQueue((events) => this.sendBatch(events));

    // Get or create visitor ID
    this.visitorId = this.cookieManager.getVisitorId() || generateVisitorId();
    this.cookieManager.setVisitorId(this.visitorId);

    // Get or create session ID
    this.sessionId = this.cookieManager.getSessionId() || generateSessionId();
    this.cookieManager.setSessionId(this.sessionId);

    this.log('SDK initialized', { config: this.config });
  }

  /**
   * Initialize SDK and start tracking
   */
  init(): void {
    if (this.initialized) return;

    // Check Do Not Track
    if (this.config.respectDoNotTrack && this.contextCollector.isDoNotTrackEnabled()) {
      this.log('Do Not Track enabled, tracking disabled');
      return;
    }

    // Capture click if affiliate params present
    if (this.config.autoTrackClicks) {
      this.captureClick();
    }

    // Auto-track page view
    if (this.config.autoTrackPageViews) {
      this.trackPageView();
    }

    // Setup batching
    if (this.config.batchEvents) {
      this.setupBatching();
    }

    // Process offline queue
    if (this.config.offlineQueue) {
      this.eventQueue.process();
    }

    // Listen for page unload to flush queue
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }

    this.initialized = true;
    this.log('SDK ready');
  }

  /**
   * Track a custom event
   */
  async track(
    type: EventType,
    data: Partial<TrackEventRequest> = {}
  ): Promise<TrackEventResponse | null> {
    try {
      const attribution = this.cookieManager.getAttributionData();
      
      if (!attribution) {
        this.log('No attribution data found, skipping event');
        return null;
      }

      const event: TrackEventRequest = {
        type,
        organizationId: this.config.organizationKey,
        campaignId: attribution.campaignId,
        affiliateId: attribution.affiliateId,
        sessionId: this.sessionId,
        clickId: attribution.clickId,
        visitorId: this.visitorId,
        context: this.contextCollector.collect(),
        ...data,
      };

      if (this.config.batchEvents) {
        this.eventQueue.add(event);
        return { success: true, eventId: 'queued' };
      } else {
        return await this.sendEvent(event);
      }
    } catch (error) {
      this.log('Error tracking event:', error);
      return null;
    }
  }

  /**
   * Track page view
   */
  async trackPageView(): Promise<TrackEventResponse | null> {
    return this.track('visit');
  }

  /**
   * Track signup
   */
  async trackSignup(data?: { userId?: string; email?: string }): Promise<TrackEventResponse | null> {
    return this.track('signup', data);
  }

  /**
   * Track purchase
   */
  async trackPurchase(data: {
    orderId: string;
    amount: number;
    currency: string;
    userId?: string;
    email?: string;
    metadata?: Record<string, any>;
  }): Promise<TrackEventResponse | null> {
    return this.track('purchase', data);
  }

  /**
   * Track custom event
   */
  async trackCustom(
    eventName: string,
    data?: { metadata?: Record<string, any> }
  ): Promise<TrackEventResponse | null> {
    return this.track('custom', {
      customEventName: eventName,
      ...data,
    });
  }

  /**
   * Capture click with affiliate parameters
   */
  private captureClick(): void {
    const params = this.contextCollector.extractAffiliateParams();
    
    if (params.affiliateId && params.campaignId) {
      const clickId = params.clickId || generateClickId();
      
      // Store attribution data
      this.cookieManager.setAttributionData({
        clickId,
        affiliateId: params.affiliateId,
        campaignId: params.campaignId,
        timestamp: Date.now(),
      });

      // Send click event
      this.track('click', { clickId });
      
      this.log('Click captured', params);
    }
  }

  /**
   * Send single event
   */
  private async sendEvent(event: TrackEventRequest): Promise<TrackEventResponse> {
    const response = await fetch(`${this.config.apiEndpoint}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send batch of events
   */
  private async sendBatch(events: TrackEventRequest[]): Promise<void> {
    if (events.length === 0) return;

    const response = await fetch(`${this.config.apiEndpoint}/track/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Setup batching timer
   */
  private setupBatching(): void {
    if (typeof window === 'undefined') return;

    this.batchTimer = window.setInterval(() => {
      if (this.eventQueue.size() >= (this.config.batchSize || 10)) {
        this.eventQueue.process();
      }
    }, this.config.batchInterval || 5000);
  }

  /**
   * Flush pending events
   */
  flush(): void {
    if (this.config.batchEvents) {
      this.eventQueue.process();
    }
  }

  /**
   * Clear all tracking data
   */
  reset(): void {
    this.cookieManager.clearAll();
    this.eventQueue.clear();
    this.log('SDK reset');
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current visitor ID
   */
  getVisitorId(): string {
    return this.visitorId;
  }

  /**
   * Get attribution data
   */
  getAttribution(): ReturnType<typeof this.cookieManager.getAttributionData> {
    return this.cookieManager.getAttributionData();
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[Growvia SDK]', ...args);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flush();
  }
}

// Auto-initialize from script tag
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const script = document.currentScript as HTMLScriptElement;
  
  if (script) {
    const organizationKey = script.getAttribute('data-growvia-key');
    
    if (organizationKey) {
      const sdk = new GrowviaSDK({ organizationKey });
      sdk.init();
      
      // Expose to window
      (window as any).growvia = sdk;
    }
  }
}
