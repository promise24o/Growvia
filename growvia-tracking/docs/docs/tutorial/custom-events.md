---
sidebar_position: 3
title: Custom Events
---

# Custom Events

## 🎯 Track Custom Events

```javascript
growvia.trackCustom('event_name', {
  metadata: {
    key: 'value'
  }
});
```

## �� Common Use Cases

### Lead Generation

```javascript
// Form submission
growvia.trackCustom('form_submit', {
  metadata: {
    formType: 'contact',
    industry: 'finance',
    leadScore: 85
  }
});

// Quote request
growvia.trackCustom('quote_request', {
  metadata: {
    service: 'consulting',
    budget: '10000-50000'
  }
});
```

### E-commerce

```javascript
// Add to cart
growvia.trackCustom('add_to_cart', {
  metadata: {
    productId: '123',
    price: 5000,
    quantity: 1
  }
});

// Wishlist add
growvia.trackCustom('add_to_wishlist', {
  metadata: {
    productId: '456'
  }
});
```

### SaaS

```javascript
// Feature usage
growvia.trackCustom('feature_used', {
  metadata: {
    feature: 'export_data',
    plan: 'pro'
  }
});

// Trial started
growvia.trackCustom('trial_started', {
  metadata: {
    plan: 'enterprise',
    duration: 14
  }
});
```

## 📚 Next Steps

- [Validating Conversions](./validating-conversions)
- [Testing Locally](./testing-locally)
