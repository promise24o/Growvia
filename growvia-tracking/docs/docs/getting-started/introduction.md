---
sidebar_position: 1
title: Introduction
description: What Growvia is and how it works
---

# Introduction

## 🌱 What Is Growvia?

Growvia is an intelligent affiliate marketing and performance management platform designed to help organizations grow through trusted, data-driven partnerships.

Whether you're an organization, affiliate marketer, or developer, Growvia provides everything you need to launch campaigns, track conversions, and reward real results — all in one unified system.

## 🚀 For Organizations

- **Create and manage** affiliate campaigns effortlessly
- **Define commission models** (clicks, visits, signups, purchases, or custom events)
- **Track conversions** in real-time using our Attribution SDK & CDN
- **Detect and prevent fraud** using AI-powered validation
- **Manage payouts** using token-based systems or monetary rewards

## 💼 For Affiliates

- **Discover verified campaigns** through the Affiliate Marketplace
- **Generate custom referral links** and landing pages
- **Track performance** and earnings from one dashboard
- **Boost visibility** with gamified leaderboards and achievements

## 🧩 Key Components

### Attribution System
Accurate tracking across multiple domains and devices with support for:
- First-click attribution
- Last-click attribution
- Linear attribution
- Time-decay attribution

### Fraud Detection
Multiple defense layers including:
- Conversion delay and IP restriction rules
- Device fingerprint checks
- Duplicate email/phone detection
- Geo-targeting filters
- Conversion spike alerts

### Analytics & Reporting
- Real-time performance dashboards
- Conversion tracking and attribution
- Revenue and payout analytics
- Campaign ROI metrics

## 🎯 Quick Links

- [How It Works](./how-it-works) - Understand the platform
- [Quick Setup (CDN)](./quick-setup-cdn) - 5-minute integration
- [API Reference](/api/overview) - Developer documentation

## 🚀 Quick Setup

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 6.0

### Installation

```bash
# Clone the repository
git clone https://github.com/growvia/growvia-tracking.git
cd growvia-tracking

# Install dependencies
npm install

# Build packages
npm run build
```

### Configure Environment

```bash
# Copy example env file
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/growvia
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Start the API

```bash
npm run api:dev
```

The API will start on `http://localhost:3001`

## 📱 Frontend Integration

### Option 1: CDN Script (Simplest)

```html
<script src="https://cdn.growvia.io/growvia.min.js" 
        data-growvia-key="your_org_key"></script>

<script>
  // Track events
  growvia.trackSignup({ userId: '123', email: 'user@example.com' });
</script>
```

### Option 2: NPM Package

```bash
npm install @growvia/sdk
```

```javascript
import { GrowviaSDK } from '@growvia/sdk';

const growvia = new GrowviaSDK({
  organizationKey: 'your_org_key',
});

growvia.init();
```

## 🧪 Test Your Integration

### 1. Simulate an Affiliate Click

Visit your site with affiliate parameters:
```
http://localhost:3000?aff_id=test_affiliate&camp_id=test_campaign
```

### 2. Track a Conversion

```javascript
growvia.trackPurchase({
  orderId: 'TEST_123',
  amount: 5000,
  currency: 'NGN',
});
```

### 3. View in Dashboard

Check the Growvia dashboard for:
- Click events
- Conversion events
- Attribution data
- Payout calculations

## 📚 Next Steps

<div className="row">
  <div className="col col--6">
    <div className="card">
      <div className="card__header">
        <h3>📦 SDK Integration</h3>
      </div>
      <div className="card__body">
        <p>Learn how to integrate the SDK into your website or app</p>
      </div>
      <div className="card__footer">
        <a href="/sdk/overview" className="button button--primary button--block">View Guide</a>
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header">
        <h3>🔌 API Reference</h3>
      </div>
      <div className="card__body">
        <p>Explore the complete API documentation</p>
      </div>
      <div className="card__footer">
        <a href="/api/overview" className="button button--primary button--block">View API Docs</a>
      </div>
    </div>
  </div>
</div>

## 💡 Common Use Cases

- **E-commerce**: Track product purchases and calculate affiliate commissions
- **SaaS**: Track signups and subscription conversions
- **Lead Generation**: Track form submissions and qualified leads
- **Mobile Apps**: Track app installs and in-app purchases

## 🆘 Need Help?

- 📧 Email: [support@growvia.io](mailto:support@growvia.io)
- 💬 GitHub Issues: [Report an issue](https://github.com/growvia/growvia-tracking/issues)
- 📖 Full Documentation: Browse the sidebar →
