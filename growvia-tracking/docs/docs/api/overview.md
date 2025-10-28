---
sidebar_position: 1
title: API Overview
description: Complete API reference for the Growvia Tracking System
---

# API Reference

Complete API reference for the Growvia Tracking System.

## Base URL

```
Production: https://track.growvia.io/api/v1
Development: http://localhost:3001/api/v1
```

## Authentication

Currently, authentication is handled via organization key in the request body. Future versions will support API keys and JWT tokens.

## Endpoints

### Track Event

Track a single conversion event.

**Endpoint:** `POST /track`

**Request Body:**
```json
{
  "type": "purchase",
  "organizationId": "507f1f77bcf86cd799439011",
  "campaignId": "507f1f77bcf86cd799439012",
  "affiliateId": "507f1f77bcf86cd799439013",
  "sessionId": "ses_abc123",
  "visitorId": "vis_xyz789",
  "clickId": "clk_def456",
  "userId": "user_123",
  "email": "user@example.com",
  "phone": "+2348012345678",
  "orderId": "ORDER_123",
  "amount": 45000,
  "currency": "NGN",
  "metadata": {
    "items": [
      { "id": "item1", "quantity": 2 }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "evt_abc123xyz",
  "attributed": true,
  "attributedAffiliateId": "507f1f77bcf86cd799439013",
  "validated": true,
  "fraudFlags": [],
  "payout": 4500
}
```

**Event Types:**
- `click` - Affiliate link click
- `visit` - Page visit
- `signup` - User registration
- `purchase` - Transaction completion
- `custom` - Custom event

---

### Track Batch Events

Track multiple events in a single request.

**Endpoint:** `POST /track/batch`

**Request Body:**
```json
{
  "events": [
    {
      "type": "visit",
      "organizationId": "...",
      "campaignId": "...",
      "affiliateId": "...",
      "sessionId": "...",
      "visitorId": "..."
    },
    {
      "type": "signup",
      "organizationId": "...",
      "campaignId": "...",
      "affiliateId": "...",
      "userId": "...",
      "email": "..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { "success": true, "eventId": "evt_1" },
    { "success": true, "eventId": "evt_2" }
  ]
}
```

---

### Get Affiliate Performance

Get performance metrics for a specific affiliate.

**Endpoint:** `GET /affiliate/:affiliateId/performance`

**Query Parameters:**
- `startDate` (required) - ISO date string (e.g., "2024-01-01")
- `endDate` (required) - ISO date string
- `campaignId` (optional) - Filter by campaign

**Response:**
```json
{
  "success": true,
  "affiliateId": "507f1f77bcf86cd799439013",
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "metrics": {
    "clicks": 1250,
    "visits": 980,
    "signups": 45,
    "purchases": 12,
    "customEvents": 5,
    "conversionRate": 4.56,
    "averageOrderValue": 52500,
    "totalRevenue": 630000,
    "totalPayout": 63000
  }
}
```

---

### Get Campaign Insights

Get detailed insights for a campaign.

**Endpoint:** `GET /campaign/:campaignId/insights`

**Query Parameters:**
- `startDate` (required) - ISO date string
- `endDate` (required) - ISO date string

**Response:**
```json
{
  "success": true,
  "campaignId": "507f1f77bcf86cd799439012",
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "overview": {
    "totalClicks": 5000,
    "totalConversions": 150,
    "totalRevenue": 2500000,
    "totalPayout": 250000,
    "roi": 900,
    "activeAffiliates": 25
  },
  "breakdown": {
    "byEventType": {
      "click": 5000,
      "visit": 3500,
      "signup": 100,
      "purchase": 50
    },
    "byAffiliate": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "conversions": 25,
        "revenue": 500000,
        "payout": 50000
      }
    ],
    "byDay": [
      {
        "date": "2024-01-01",
        "conversions": 5,
        "revenue": 100000,
        "payout": 10000
      }
    ]
  },
  "fraudDetection": {
    "totalFlagged": 10,
    "totalValidated": 140,
    "totalPending": 0
  }
}
```

---

### Get Event Details

Get details of a specific event.

**Endpoint:** `GET /event/:eventId`

**Response:**
```json
{
  "success": true,
  "event": {
    "eventId": "evt_abc123xyz",
    "type": "purchase",
    "timestamp": "2024-01-15T10:30:00Z",
    "organizationId": {
      "_id": "...",
      "name": "My Company"
    },
    "campaignId": {
      "_id": "...",
      "name": "Summer Sale 2024"
    },
    "affiliateId": {
      "_id": "...",
      "userId": "..."
    },
    "orderId": "ORDER_123",
    "amount": 45000,
    "currency": "NGN",
    "status": "validated",
    "payout": 4500,
    "fraudFlags": [],
    "context": {
      "url": "https://example.com/checkout",
      "referrer": "https://google.com",
      "ip": "197.210.x.x",
      "country": "NG",
      "userAgent": "Mozilla/5.0..."
    }
  }
}
```

---

### Health Check

Check API health status.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## Rate Limiting

- **Window:** 60 seconds
- **Max Requests:** 100 per IP
- **Headers:**
  - `X-RateLimit-Limit` - Max requests allowed
  - `X-RateLimit-Remaining` - Requests remaining
  - `X-RateLimit-Reset` - Time when limit resets

---

## Webhooks (Future)

### Conversion Created
Triggered when a new conversion is tracked.

**Payload:**
```json
{
  "event": "conversion.created",
  "timestamp": 1705315800000,
  "data": {
    "eventId": "evt_abc123",
    "type": "purchase",
    "amount": 45000,
    "affiliateId": "...",
    "campaignId": "..."
  },
  "signature": "sha256_signature_here"
}
```

### Conversion Validated
Triggered when a conversion is validated.

**Payload:**
```json
{
  "event": "conversion.validated",
  "timestamp": 1705315800000,
  "data": {
    "eventId": "evt_abc123",
    "status": "validated",
    "payout": 4500
  },
  "signature": "sha256_signature_here"
}
```

---

## SDK Methods

### JavaScript SDK

```javascript
import { GrowviaSDK } from '@growvia/sdk';

const growvia = new GrowviaSDK({
  organizationKey: 'org_key',
  apiEndpoint: 'https://track.growvia.io',
  cookieDomain: '.example.com',
  cookieTTL: 604800, // 7 days
  attributionModel: 'last-click',
  conversionWindow: 604800,
  autoTrackPageViews: true,
  autoTrackClicks: true,
  batchEvents: false,
  debug: false,
});

// Initialize
growvia.init();

// Track events
growvia.trackPageView();
growvia.trackSignup({ userId, email });
growvia.trackPurchase({ orderId, amount, currency });
growvia.trackCustom('event_name', { metadata });

// Get data
const sessionId = growvia.getSessionId();
const visitorId = growvia.getVisitorId();
const attribution = growvia.getAttribution();

// Utility
growvia.flush(); // Flush pending events
growvia.reset(); // Clear all data
growvia.destroy(); // Cleanup
```

---

## Data Models

### TrackingEvent

```typescript
interface TrackingEvent {
  eventId: string;
  type: 'click' | 'visit' | 'signup' | 'purchase' | 'custom';
  timestamp: Date;
  organizationId: ObjectId;
  campaignId: ObjectId;
  affiliateId: ObjectId;
  sessionId: string;
  clickId?: string;
  visitorId: string;
  userId?: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, any>;
  orderId?: string;
  amount?: number;
  currency?: string;
  customEventName?: string;
  context: EventContext;
  attribution?: AttributionData;
  status: 'pending' | 'validated' | 'rejected' | 'fraud';
  rejectionReason?: string;
  fraudFlags?: string[];
  payout?: number;
  payoutCurrency?: string;
  payoutStatus?: 'pending' | 'approved' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}
```

### EventContext

```typescript
interface EventContext {
  url: string;
  referrer?: string;
  title?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  userAgent: string;
  ip: string;
  language?: string;
  screenResolution?: string;
  deviceFingerprint?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}
```

### AttributionData

```typescript
interface AttributionData {
  model: 'first-click' | 'last-click' | 'linear' | 'time-decay';
  touchpoints: Touchpoint[];
  attributedAffiliateId: string;
  attributionWeight: number;
  conversionWindow: number;
}
```

---

## Best Practices

1. **Always include session and visitor IDs** for accurate attribution
2. **Use batch tracking** for high-volume events
3. **Implement retry logic** for failed requests
4. **Validate data** before sending to API
5. **Monitor fraud flags** and adjust rules as needed
6. **Test in development** before deploying to production
7. **Use webhooks** for real-time validation
8. **Cache API responses** when appropriate
9. **Handle rate limits** gracefully
10. **Keep SDK updated** to latest version
