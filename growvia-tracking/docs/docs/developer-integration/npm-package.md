---
sidebar_position: 2
title: NPM Package Usage
---

# NPM Package Usage

## 📦 Installation

```bash
npm install @growvia/sdk
```

## 🚀 Basic Usage

```typescript
import { GrowviaSDK } from '@growvia/sdk';

const growvia = new GrowviaSDK({
  organizationKey: 'org_123456'
});

growvia.init();
```

## ⚛️ React Integration

```tsx
import { useEffect } from 'react';
import { GrowviaSDK } from '@growvia/sdk';

const growvia = new GrowviaSDK({
  organizationKey: process.env.REACT_APP_GROWVIA_KEY!
});

export function useGrowvia() {
  useEffect(() => {
    growvia.init();
  }, []);

  return growvia;
}
```

## 🟢 Node.js Backend

```typescript
import { GrowviaSDK } from '@growvia/sdk';

const growvia = new GrowviaSDK({
  organizationKey: process.env.GROWVIA_ORG_KEY!,
  apiEndpoint: process.env.GROWVIA_API_ENDPOINT
});

app.post('/api/orders', async (req, res) => {
  await growvia.trackPurchase({
    orderId: order.id,
    amount: order.total,
    currency: 'NGN'
  });
});
```

## 📚 Next Steps

- [Webhook Events](./webhook-events)
- [Attribution Logic](./attribution-logic)
