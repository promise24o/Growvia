---
sidebar_position: 2
title: Track Signups and Purchases
---

# Track Signups and Purchases

## 📝 Track Signups

```javascript
// Basic signup
growvia.trackSignup({
  userId: '123',
  email: 'user@example.com'
});

// With additional data
growvia.trackSignup({
  userId: '123',
  email: 'user@example.com',
  phone: '+2348012345678',
  metadata: {
    source: 'affiliate',
    plan: 'free_trial',
    referrer: document.referrer
  }
});
```

### React Example

```jsx
function SignupForm() {
  const handleSubmit = async (formData) => {
    try {
      const user = await createUser(formData);
      
      // Track signup
      await growvia.trackSignup({
        userId: user.id,
        email: user.email,
        metadata: {
          plan: formData.plan
        }
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 💳 Track Purchases

```javascript
// Basic purchase
growvia.trackPurchase({
  orderId: 'ORDER_123',
  amount: 5000,
  currency: 'NGN'
});

// Complete purchase data
growvia.trackPurchase({
  orderId: 'ORDER_123',
  amount: 5000,
  currency: 'NGN',
  userId: '123',
  email: 'user@example.com',
  metadata: {
    items: [
      { id: 'prod_1', name: 'Product 1', price: 3000, quantity: 1 },
      { id: 'prod_2', name: 'Product 2', price: 2000, quantity: 1 }
    ],
    shipping: 500,
    tax: 500,
    discount: 1000,
    paymentMethod: 'card'
  }
});
```

### E-commerce Integration

```javascript
// After successful checkout
async function onCheckoutComplete(order) {
  try {
    await growvia.trackPurchase({
      orderId: order.id,
      amount: order.total,
      currency: order.currency,
      userId: order.userId,
      email: order.email,
      metadata: {
        items: order.items.map(item => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        shipping: order.shippingCost,
        tax: order.tax
      }
    });
    
    // Redirect to success page
    window.location.href = '/order-success';
  } catch (error) {
    console.error('Tracking error:', error);
  }
}
```

## 🔄 Server-Side Tracking

```javascript
// Node.js backend
import { GrowviaSDK } from '@growvia/sdk';

const growvia = new GrowviaSDK({
  organizationKey: process.env.GROWVIA_ORG_KEY
});

app.post('/api/orders', async (req, res) => {
  const order = await createOrder(req.body);
  
  // Track purchase server-side
  await growvia.trackPurchase({
    orderId: order.id,
    amount: order.total,
    currency: 'NGN',
    userId: req.user.id,
    email: req.user.email,
    // Get attribution from cookies
    affiliateId: req.cookies.aff_id,
    campaignId: req.cookies.camp_id,
    clickId: req.cookies.click_id,
    organizationId: process.env.GROWVIA_ORG_KEY
  });
  
  res.json(order);
});
```

## 🎯 Best Practices

### 1. Track After Successful Action

```javascript
// ✅ Good
async function signup(data) {
  const user = await createUser(data);
  await growvia.trackSignup({ userId: user.id, email: user.email });
  return user;
}

// ❌ Bad - tracking before confirmation
function signup(data) {
  growvia.trackSignup({ email: data.email }); // User might not be created!
  return createUser(data);
}
```

### 2. Include User Identifiers

```javascript
// ✅ Good - includes userId and email
growvia.trackSignup({
  userId: '123',
  email: 'user@example.com'
});

// ⚠️ Okay - but less useful
growvia.trackSignup({
  email: 'user@example.com'
});
```

### 3. Add Relevant Metadata

```javascript
// ✅ Good - rich metadata
growvia.trackPurchase({
  orderId: 'ORDER_123',
  amount: 5000,
  currency: 'NGN',
  metadata: {
    items: [...],
    paymentMethod: 'card',
    shippingMethod: 'express'
  }
});
```

### 4. Handle Errors

```javascript
try {
  await growvia.trackPurchase({...});
} catch (error) {
  console.error('Tracking failed:', error);
  // Don't block user flow
}
```

## 🧪 Testing

### Test Signup Tracking

```javascript
// Enable debug mode
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  debug: true
});

// Test signup
growvia.trackSignup({
  userId: 'test_123',
  email: 'test@example.com'
});

// Check console for:
// ✓ Signup tracked successfully
// Event ID: evt_xxx
```

### Test Purchase Tracking

```javascript
// Test purchase
growvia.trackPurchase({
  orderId: 'TEST_ORDER_' + Date.now(),
  amount: 1000,
  currency: 'NGN'
});

// Verify in dashboard:
// - Event appears in real-time
// - Attribution is correct
// - Commission is calculated
```

## 📚 Next Steps

- [Custom Events](./custom-events)
- [Validating Conversions](./validating-conversions)
- [Testing Locally](./testing-locally)
