/**
 * Growvia Tracking System - Shared Utilities
 */
import type { EventContext, Touchpoint, AttributionModel } from './types';
export declare function generateEventId(): string;
export declare function generateClickId(): string;
export declare function generateSessionId(): string;
export declare function generateVisitorId(): string;
export declare const COOKIE_NAMES: {
    readonly ATTRIBUTION: "_growvia_attrib";
    readonly SESSION: "_growvia_session";
    readonly VISITOR: "_growvia_visitor";
};
export interface CookieOptions {
    domain?: string;
    path?: string;
    maxAge?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}
export declare function serializeCookie(name: string, value: string, options?: CookieOptions): string;
export declare function parseCookie(cookieString: string): Record<string, string>;
export declare function calculateAttribution(touchpoints: Touchpoint[], model: AttributionModel): Map<string, number>;
export declare function generateDeviceFingerprint(context: Partial<EventContext>): string;
export declare function hashString(str: string): string;
export declare function anonymizeIp(ip: string): string;
export declare function isPrivateIp(ip: string): boolean;
export declare function extractUtmParams(url: string): Record<string, string>;
export declare function extractAffiliateParams(url: string): {
    affiliateId?: string;
    campaignId?: string;
    clickId?: string;
};
export declare function isWithinWindow(timestamp: number, windowSeconds: number): boolean;
export declare function addSeconds(timestamp: number, seconds: number): number;
export declare function formatDuration(seconds: number): string;
export declare function isValidEmail(email: string): boolean;
export declare function isValidPhone(phone: string): boolean;
export declare function isValidCountryCode(code: string): boolean;
export declare function isValidCurrency(currency: string): boolean;
export declare function sanitizeMetadata(metadata: any): Record<string, any>;
export declare function generateRateLimitKey(prefix: string, identifier: string, window: 'second' | 'minute' | 'hour' | 'day'): string;
export declare function isTrackingError(error: any): boolean;
export declare function formatError(error: any): {
    message: string;
    code?: string;
    details?: any;
};
export declare function generateHmacSignature(data: string, secret: string): Promise<string>;
export declare function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean>;
//# sourceMappingURL=utils.d.ts.map