---
sidebar_position: 4
title: Validating Conversions
---

# Validating Conversions

## ✅ Automatic Validation

Conversions are automatically validated based on fraud detection rules.

## 🔍 Manual Review

Review conversions in dashboard:
1. Go to Conversions
2. Filter by "Pending"
3. Review details
4. Approve or Reject

## 🔗 Webhook Validation

```javascript
app.post('/webhooks/growvia/conversion', async (req, res) => {
  const { eventId, type, amount, userId } = req.body;
  
  const isValid = await validateInYourSystem(userId, amount);
  
  await fetch('https://track.growvia.io/api/v1/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId,
      approved: isValid,
      rejectionReason: isValid ? undefined : 'Invalid order'
    })
  });
  
  res.status(200).json({ received: true });
});
```

## 📚 Next Steps

- [Testing Locally](./testing-locally)
- [Fraud Detection](../create-manage/fraud-detection)
