---
sidebar_position: 5
title: Testing Locally
---

# Testing Locally

## 🧪 Development Setup

```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_test_123',
  apiEndpoint: 'http://localhost:3001',
  debug: true
});
```

## 🔗 Test Affiliate Links

```
http://localhost:3000?aff_id=test_aff&camp_id=test_camp
```

## ✅ Verify Tracking

```javascript
// Check cookies
console.log(document.cookie);

// Check attribution
console.log(growvia.getAttribution());

// Test events
growvia.trackSignup({
  userId: 'test_123',
  email: 'test@example.com'
});
```

## 📊 View in Dashboard

1. Go to dashboard
2. Filter by test campaign
3. View real-time events

## 📚 Next Steps

- [Create a Campaign](../create-manage/create-campaign)
- [Developer Integration](../developer-integration/javascript-sdk)
