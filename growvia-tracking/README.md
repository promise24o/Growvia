# Growvia Tracking and Attribution System

A modular SDK and backend service for affiliate tracking, attribution, and event reporting.

## 🎯 Overview

The Growvia Tracking System allows organizations and affiliates to track campaign performance across multiple conversion types:
- **Click** - Track affiliate link clicks
- **Visit** - Track page visits
- **Signup** - Track user registrations
- **Purchase** - Track completed transactions
- **Custom** - Track custom conversion events

## 📁 Project Structure

```
growvia-tracking/
├── packages/
│   ├── sdk/           # Client-side JavaScript SDK
│   ├── server/        # MongoDB models, Redis cache, services
│   ├── shared/        # Shared types, schemas, utilities
│   └── cli/           # CLI tools
├── apps/
│   ├── api/           # Express API server
│   └── worker/        # Background job processor
├── docs/              # Documentation
└── infrastructure/    # Docker, deployment configs
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 6.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start API server
npm run api:dev
```

### Environment Setup

Create `.env` file in `apps/api`:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/growvia
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=*
DEFAULT_ATTRIBUTION_MODEL=last-click
DEFAULT_CONVERSION_WINDOW=604800
```

## 📦 Packages

### @growvia/sdk

Client-side tracking SDK for websites and web applications.

**Installation:**
```bash
npm install @growvia/sdk
```

**Usage:**
```javascript
import { GrowviaSDK } from '@growvia/sdk';

const growvia = new GrowviaSDK({
  organizationKey: 'your_org_key',
  apiEndpoint: 'https://track.growvia.io',
});

growvia.init();

// Track events
growvia.trackSignup({ userId: '123', email: 'user@example.com' });
growvia.trackPurchase({
  orderId: 'ORDER123',
  amount: 4500,
  currency: 'NGN',
});
```

### @growvia/server

Server-side package with MongoDB models, Redis caching, and core services.

**Features:**
- MongoDB models for events, clicks, sessions
- Redis caching for fast attribution
- Attribution engine (first-click, last-click, linear, time-decay)
- Fraud detection service

### @growvia/shared

Shared types, schemas, and utilities used across packages.

## 🌐 CDN Integration

For simple websites, use the CDN script:

```html
<script src="https://cdn.growvia.io/growvia.min.js" data-growvia-key="your_org_key"></script>

<script>
  // SDK is automatically initialized and available as window.growvia
  growvia.trackSignup({ userId: '123' });
</script>
```

## 🔌 API Endpoints

### Track Event
```http
POST /api/v1/track
Content-Type: application/json

{
  "type": "purchase",
  "organizationId": "org_123",
  "campaignId": "camp_456",
  "affiliateId": "aff_789",
  "orderId": "ORDER123",
  "amount": 4500,
  "currency": "NGN",
  "sessionId": "ses_xxx",
  "visitorId": "vis_yyy"
}
```

### Get Affiliate Performance
```http
GET /api/v1/affiliate/:affiliateId/performance?startDate=2024-01-01&endDate=2024-01-31
```

### Get Campaign Insights
```http
GET /api/v1/campaign/:campaignId/insights?startDate=2024-01-01&endDate=2024-01-31
```

## 🛡️ Fraud Detection

The system includes comprehensive fraud detection:

- **Conversion Delay** - Minimum time between click and conversion
- **IP Restriction** - Limit conversions per IP address
- **Device Fingerprinting** - Detect suspicious device patterns
- **Duplicate Prevention** - Block duplicate email/phone conversions
- **Geo Targeting** - Allow/block specific countries
- **Order Value Limits** - Min/max order value validation
- **Behavioral Analysis** - Time on site, page views
- **Velocity Checks** - Detect conversion spikes
- **Cookie Tampering** - Detect modified tracking cookies

## 📊 Attribution Models

### Last-Click (Default)
Credits the last affiliate click before conversion.

### First-Click
Credits the first affiliate click in the customer journey.

### Linear
Distributes credit equally across all touchpoints.

### Time-Decay
Gives more credit to recent touchpoints using exponential decay.

## 🗄️ Database Schema

### TrackingEvent
Stores all tracking events with full context and attribution data.

### ClickTracking
Stores click data for attribution matching with TTL expiration.

### SessionTracking
Stores session data for behavioral analysis.

## 🔧 Integration with Existing Growvia System

The tracking system integrates seamlessly with your existing models:

- **Campaign** - Links to existing campaign model
- **CampaignAffiliate** - Updates performance metrics (clicks, conversions, revenue, commission)
- **Commission** - Uses fraud detection rules from commission models
- **Organization** - Links to organization for multi-tenancy

## 📈 Performance Metrics

Tracked metrics include:
- Total clicks
- Total conversions (by type)
- Conversion rate
- Total revenue
- Total payout
- Average order value
- ROI per campaign
- Fraud detection stats

## 🔐 Security Features

- HTTPS required for production
- Rate limiting on tracking endpoints
- IP anonymization support
- HMAC signature verification (planned)
- Do Not Track compliance
- GDPR-compliant cookie handling

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📚 Documentation

See `/docs` folder for detailed documentation:
- Integration Guide
- API Reference
- SDK Reference
- Fraud Detection Guide
- Attribution Models Guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email support@growvia.io or open an issue on GitHub.
