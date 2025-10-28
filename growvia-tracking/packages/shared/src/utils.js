"use strict";
/**
 * Growvia Tracking System - Shared Utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOKIE_NAMES = void 0;
exports.generateEventId = generateEventId;
exports.generateClickId = generateClickId;
exports.generateSessionId = generateSessionId;
exports.generateVisitorId = generateVisitorId;
exports.serializeCookie = serializeCookie;
exports.parseCookie = parseCookie;
exports.calculateAttribution = calculateAttribution;
exports.generateDeviceFingerprint = generateDeviceFingerprint;
exports.hashString = hashString;
exports.anonymizeIp = anonymizeIp;
exports.isPrivateIp = isPrivateIp;
exports.extractUtmParams = extractUtmParams;
exports.extractAffiliateParams = extractAffiliateParams;
exports.isWithinWindow = isWithinWindow;
exports.addSeconds = addSeconds;
exports.formatDuration = formatDuration;
exports.isValidEmail = isValidEmail;
exports.isValidPhone = isValidPhone;
exports.isValidCountryCode = isValidCountryCode;
exports.isValidCurrency = isValidCurrency;
exports.sanitizeMetadata = sanitizeMetadata;
exports.generateRateLimitKey = generateRateLimitKey;
exports.isTrackingError = isTrackingError;
exports.formatError = formatError;
exports.generateHmacSignature = generateHmacSignature;
exports.verifyHmacSignature = verifyHmacSignature;
const nanoid_1 = require("nanoid");
// ============================================================================
// ID Generation
// ============================================================================
function generateEventId() {
    return `evt_${(0, nanoid_1.nanoid)(21)}`;
}
function generateClickId() {
    return `clk_${(0, nanoid_1.nanoid)(21)}`;
}
function generateSessionId() {
    return `ses_${(0, nanoid_1.nanoid)(21)}`;
}
function generateVisitorId() {
    return `vis_${(0, nanoid_1.nanoid)(21)}`;
}
// ============================================================================
// Cookie Utilities
// ============================================================================
exports.COOKIE_NAMES = {
    ATTRIBUTION: '_growvia_attrib',
    SESSION: '_growvia_session',
    VISITOR: '_growvia_visitor',
};
function serializeCookie(name, value, options = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`];
    if (options.domain)
        parts.push(`Domain=${options.domain}`);
    if (options.path)
        parts.push(`Path=${options.path}`);
    if (options.maxAge)
        parts.push(`Max-Age=${options.maxAge}`);
    if (options.secure)
        parts.push('Secure');
    if (options.sameSite)
        parts.push(`SameSite=${options.sameSite}`);
    return parts.join('; ');
}
function parseCookie(cookieString) {
    const cookies = {};
    if (!cookieString)
        return cookies;
    cookieString.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        if (name && rest.length > 0) {
            cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
        }
    });
    return cookies;
}
// ============================================================================
// Attribution Utilities
// ============================================================================
function calculateAttribution(touchpoints, model) {
    const attribution = new Map();
    if (touchpoints.length === 0)
        return attribution;
    switch (model) {
        case 'first-click':
            attribution.set(touchpoints[0].affiliateId, 1.0);
            break;
        case 'last-click':
            attribution.set(touchpoints[touchpoints.length - 1].affiliateId, 1.0);
            break;
        case 'linear':
            const linearWeight = 1.0 / touchpoints.length;
            touchpoints.forEach(tp => {
                const current = attribution.get(tp.affiliateId) || 0;
                attribution.set(tp.affiliateId, current + linearWeight);
            });
            break;
        case 'time-decay':
            const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
            const now = Date.now();
            let totalWeight = 0;
            // Calculate weights
            const weights = touchpoints.map(tp => {
                const age = now - tp.timestamp;
                const weight = Math.exp(-age / halfLife);
                totalWeight += weight;
                return { affiliateId: tp.affiliateId, weight };
            });
            // Normalize weights
            weights.forEach(({ affiliateId, weight }) => {
                const normalizedWeight = weight / totalWeight;
                const current = attribution.get(affiliateId) || 0;
                attribution.set(affiliateId, current + normalizedWeight);
            });
            break;
    }
    return attribution;
}
// ============================================================================
// Fingerprinting
// ============================================================================
function generateDeviceFingerprint(context) {
    const components = [
        context.userAgent || '',
        context.language || '',
        context.screenResolution || '',
        context.timezone || '',
    ];
    return hashString(components.join('|'));
}
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}
// ============================================================================
// IP Utilities
// ============================================================================
function anonymizeIp(ip) {
    if (ip.includes(':')) {
        // IPv6
        const parts = ip.split(':');
        return parts.slice(0, 4).join(':') + '::';
    }
    else {
        // IPv4
        const parts = ip.split('.');
        return parts.slice(0, 3).join('.') + '.0';
    }
}
function isPrivateIp(ip) {
    if (ip.includes(':')) {
        // IPv6 - simplified check
        return ip.startsWith('fc') || ip.startsWith('fd') || ip === '::1';
    }
    else {
        // IPv4
        const parts = ip.split('.').map(Number);
        return (parts[0] === 10 ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168) ||
            parts[0] === 127);
    }
}
// ============================================================================
// URL Utilities
// ============================================================================
function extractUtmParams(url) {
    const params = {};
    try {
        const urlObj = new URL(url);
        const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        utmKeys.forEach(key => {
            const value = urlObj.searchParams.get(key);
            if (value) {
                params[key.replace('utm_', '')] = value;
            }
        });
    }
    catch (error) {
        // Invalid URL
    }
    return params;
}
function extractAffiliateParams(url) {
    try {
        const urlObj = new URL(url);
        return {
            affiliateId: urlObj.searchParams.get('aff_id') || urlObj.searchParams.get('affiliate_id') || undefined,
            campaignId: urlObj.searchParams.get('camp_id') || urlObj.searchParams.get('campaign_id') || undefined,
            clickId: urlObj.searchParams.get('click_id') || undefined,
        };
    }
    catch (error) {
        return {};
    }
}
// ============================================================================
// Time Utilities
// ============================================================================
function isWithinWindow(timestamp, windowSeconds) {
    const now = Date.now();
    const age = now - timestamp;
    return age <= windowSeconds * 1000;
}
function addSeconds(timestamp, seconds) {
    return timestamp + (seconds * 1000);
}
function formatDuration(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0)
        parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0)
        parts.push(`${secs}s`);
    return parts.join(' ');
}
// ============================================================================
// Validation Utilities
// ============================================================================
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidPhone(phone) {
    // Basic international phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}
function isValidCountryCode(code) {
    return /^[A-Z]{2}$/.test(code);
}
function isValidCurrency(currency) {
    return /^[A-Z]{3}$/.test(currency);
}
// ============================================================================
// Data Sanitization
// ============================================================================
function sanitizeMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object')
        return {};
    const sanitized = {};
    for (const [key, value] of Object.entries(metadata)) {
        // Skip functions and undefined
        if (typeof value === 'function' || value === undefined)
            continue;
        // Limit string length
        if (typeof value === 'string' && value.length > 1000) {
            sanitized[key] = value.substring(0, 1000) + '...';
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
// ============================================================================
// Rate Limiting Utilities
// ============================================================================
function generateRateLimitKey(prefix, identifier, window) {
    const now = new Date();
    let timeKey;
    switch (window) {
        case 'second':
            timeKey = Math.floor(now.getTime() / 1000).toString();
            break;
        case 'minute':
            timeKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
            break;
        case 'hour':
            timeKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
            break;
        case 'day':
            timeKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
            break;
    }
    return `${prefix}:${identifier}:${timeKey}`;
}
// ============================================================================
// Error Handling
// ============================================================================
function isTrackingError(error) {
    return error && error.name === 'TrackingError';
}
function formatError(error) {
    if (isTrackingError(error)) {
        return {
            message: error.message,
            code: error.code,
            details: error.details,
        };
    }
    return {
        message: error?.message || 'Unknown error',
    };
}
// ============================================================================
// Crypto Utilities (for HMAC signatures)
// ============================================================================
async function generateHmacSignature(data, secret) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        // Browser or modern Node.js
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    else {
        // Node.js fallback (will be implemented in server package)
        throw new Error('HMAC not available in this environment');
    }
}
function verifyHmacSignature(data, signature, secret) {
    return generateHmacSignature(data, secret)
        .then(expected => expected === signature)
        .catch(() => false);
}
//# sourceMappingURL=utils.js.map