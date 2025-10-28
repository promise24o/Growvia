/**
 * Growvia Tracking SDK - Entry Point
 */

export { GrowviaSDK } from './growvia-sdk';
export { CookieManager } from './cookie-manager';
export { ContextCollector } from './context-collector';
export { EventQueue } from './event-queue';

// Re-export types from shared
export type {
  SDKConfig,
  TrackEventRequest,
  TrackEventResponse,
  EventType,
  EventContext,
} from '@growvia/shared';

// Default export
export { GrowviaSDK as default } from './growvia-sdk';
