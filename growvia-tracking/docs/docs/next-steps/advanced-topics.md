---
sidebar_position: 2
title: Advanced Topics
---

# Advanced Topics

## 🎯 Multi-Touch Attribution

Growvia supports multiple attribution models:

```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  attributionModel: 'linear' // first-click, last-click, linear, time-decay
});
```

### Attribution Models

- **First-Click**: Credits the first touchpoint
- **Last-Click**: Credits the last touchpoint (default)
- **Linear**: Distributes credit equally
- **Time-Decay**: More credit to recent touchpoints

## 🤖 AI-Powered Fraud Detection

Machine learning models analyze conversion patterns:

```typescript
// Automatic fraud scoring
- Velocity analysis
- Pattern detection
- Behavioral analysis
- Risk scoring
```

Fraud analysis runs automatically via the worker service.

## 📊 Advanced Analytics

### CLI Analytics

```bash
# Overall summary
growvia analytics summary --days 30

# Top performers
growvia analytics top-affiliates --limit 10

# Campaign stats
growvia campaign stats <campaignId>
```

### Worker Service

- Daily aggregation
- Cohort analysis
- Funnel tracking
- Lifetime value calculation
- ROI optimization

## 🔗 Cross-Domain Tracking

Track users across multiple domains:

```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  cookieDomain: '.yourdomain.com' // Works across subdomains
});
```

## 🌍 Multi-Currency Support

Handle international campaigns:

```javascript
growvia.trackPurchase({
  orderId: 'ORDER_123',
  amount: 5000,
  currency: 'NGN' // or USD, EUR, GBP, etc.
});
```

## 🎨 Custom Dashboards

Build custom analytics dashboards using the API:

```javascript
// Fetch analytics data
const response = await fetch('/api/v1/analytics/summary', {
  headers: {
    'Authorization': `Bearer ${apiToken}`
  }
});
```

## 📚 Resources

- [API Reference](../../api/overview)
- [GitHub](https://github.com/growvia)
- [Blog](https://growvia.com/blog)
