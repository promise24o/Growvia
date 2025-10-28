---
sidebar_position: 4
title: Quick Setup (NPM)
---

# Quick Setup (NPM)

## 📦 Installation

```bash
npm install @growvia/sdk
```

## 🚀 Basic Usage

```javascript
import { GrowviaSDK } from '@growvia/sdk';

const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  apiEndpoint: 'https://track.growvia.io'
});

growvia.init();
```

## ⚛️ React Integration

```jsx
import { useEffect } from 'react';
import { GrowviaSDK } from '@growvia/sdk';

const growvia = new GrowviaSDK({
  organizationKey: process.env.REACT_APP_GROWVIA_KEY
});

function App() {
  useEffect(() => {
    growvia.init();
  }, []);

  const handleSignup = async (userData) => {
    await createUser(userData);
    growvia.trackSignup({
      userId: userData.id,
      email: userData.email
    });
  };

  return <div>Your App</div>;
}
```

## 🔷 Next.js Integration

```typescript
// hooks/useGrowvia.ts
import { useEffect, useRef } from 'react';
import { GrowviaSDK } from '@growvia/sdk';

export function useGrowvia() {
  const sdkRef = useRef<GrowviaSDK | null>(null);

  useEffect(() => {
    if (!sdkRef.current) {
      sdkRef.current = new GrowviaSDK({
        organizationKey: process.env.NEXT_PUBLIC_GROWVIA_KEY!
      });
      sdkRef.current.init();
    }
  }, []);

  return sdkRef.current;
}

// pages/checkout.tsx
'use client';

import { useGrowvia } from '@/hooks/useGrowvia';

export default function CheckoutPage() {
  const growvia = useGrowvia();

  const handleCheckout = async (orderData) => {
    const order = await processOrder(orderData);
    growvia?.trackPurchase({
      orderId: order.id,
      amount: order.total,
      currency: 'NGN'
    });
  };

  return <div>Checkout</div>;
}
```

## 🟢 Node.js Backend

```javascript
import { GrowviaSDK } from '@growvia/sdk';

const growvia = new GrowviaSDK({
  organizationKey: process.env.GROWVIA_ORG_KEY,
  apiEndpoint: process.env.GROWVIA_API_ENDPOINT
});

// Track server-side conversion
app.post('/api/orders', async (req, res) => {
  const order = await createOrder(req.body);
  
  await growvia.trackPurchase({
    orderId: order.id,
    amount: order.total,
    currency: 'NGN',
    userId: req.user.id,
    affiliateId: req.cookies.aff_id,
    campaignId: req.cookies.camp_id,
    organizationId: process.env.GROWVIA_ORG_KEY
  });
  
  res.json(order);
});
```

## ⚙️ Configuration Options

```typescript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  apiEndpoint: 'https://track.growvia.io',
  cookieDomain: '.yourdomain.com',
  cookieTTL: 604800,
  attributionModel: 'last-click',
  conversionWindow: 604800,
  autoTrackPageViews: true,
  autoTrackClicks: true,
  batchEvents: false,
  batchSize: 10,
  batchInterval: 5000,
  offlineQueue: true,
  respectDoNotTrack: true,
  anonymizeIp: true,
  debug: false
});
```

## 🎯 Track Events

```javascript
// Signup
growvia.trackSignup({
  userId: '123',
  email: 'user@example.com',
  metadata: { source: 'affiliate' }
});

// Purchase
growvia.trackPurchase({
  orderId: 'ORDER_123',
  amount: 5000,
  currency: 'NGN',
  userId: '123',
  metadata: { items: [...] }
});

// Custom Event
growvia.trackCustom('form_submit', {
  metadata: { formType: 'contact' }
});

// Page View
growvia.trackPageView();
```

## 🔧 Advanced Features

### Batch Events

```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  batchEvents: true,
  batchSize: 10,
  batchInterval: 5000
});

// Events are automatically batched
growvia.trackCustom('event1');
growvia.trackCustom('event2');
// Sent together after 5s or 10 events
```

### Offline Queue

```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  offlineQueue: true
});

// Events are queued when offline
// Automatically sent when back online
```

### Manual Flush

```javascript
// Force send pending events
await growvia.flush();
```

## 📚 Next Steps

- [API Authentication](./api-authentication)
- [Track Signups and Purchases](../tutorial/track-signups-purchases)
- [JavaScript SDK Reference](../developer-integration/javascript-sdk)
