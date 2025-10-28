"use strict";
/**
 * Growvia Tracking System - Shared Types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.TrackingError = void 0;
// ============================================================================
// Error Types
// ============================================================================
class TrackingError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code, statusCode = 400, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'TrackingError';
    }
}
exports.TrackingError = TrackingError;
exports.ErrorCodes = {
    INVALID_EVENT: 'INVALID_EVENT',
    INVALID_ORGANIZATION: 'INVALID_ORGANIZATION',
    INVALID_CAMPAIGN: 'INVALID_CAMPAIGN',
    INVALID_AFFILIATE: 'INVALID_AFFILIATE',
    FRAUD_DETECTED: 'FRAUD_DETECTED',
    DUPLICATE_EVENT: 'DUPLICATE_EVENT',
    EXPIRED_CLICK: 'EXPIRED_CLICK',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    UNAUTHORIZED: 'UNAUTHORIZED',
};
//# sourceMappingURL=types.js.map