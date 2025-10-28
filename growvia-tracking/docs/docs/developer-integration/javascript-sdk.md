---
sidebar_position: 1
title: JavaScript SDK (CDN)
---

# JavaScript SDK (CDN)

## 📦 Installation

```html
<script src="https://cdn.growvia.io/growvia.min.js" 
        data-growvia-key="org_123456"></script>
```

## ⚙️ Configuration

```javascript
window.growviaConfig = {
  organizationKey: 'org_123456',
  apiEndpoint: 'https://track.growvia.io',
  autoTrackPageViews: true,
  autoTrackClicks: true,
  cookieDomain: '.yourdomain.com',
  cookieTTL: 604800,
  debug: false
};
```

## 🎯 Methods

### trackSignup()
```javascript
growvia.trackSignup({
  userId: '123',
  email: 'user@example.com'
});
```

### trackPurchase()
```javascript
growvia.trackPurchase({
  orderId: 'ORDER_123',
  amount: 5000,
  currency: 'NGN'
});
```

### trackCustom()
```javascript
growvia.trackCustom('event_name', {
  metadata: { key: 'value' }
});
```

### trackPageView()
```javascript
growvia.trackPageView();
```

## 🔧 Utility Methods

```javascript
// Get session ID
const sessionId = growvia.getSessionId();

// Get visitor ID
const visitorId = growvia.getVisitorId();

// Get attribution
const attribution = growvia.getAttribution();

// Flush pending events
await growvia.flush();

// Reset tracking data
growvia.reset();

// Destroy SDK
growvia.destroy();
```

## 📚 Next Steps

- [NPM Package Usage](./npm-package)
- [Webhook Events](./webhook-events)
