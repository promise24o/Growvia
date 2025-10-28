---
sidebar_position: 3
title: Webhook Events
---

# Webhook Events

## 🔔 Setup Webhooks

1. Go to Dashboard → Settings → Webhooks
2. Add webhook URL
3. Select events to receive
4. Save configuration

## 📨 Event Types

### conversion.created
```json
{
  "event": "conversion.created",
  "timestamp": 1705315800000,
  "data": {
    "eventId": "evt_abc123",
    "type": "purchase",
    "amount": 45000,
    "affiliateId": "aff_123",
    "campaignId": "camp_456"
  }
}
```

### conversion.validated
```json
{
  "event": "conversion.validated",
  "timestamp": 1705315800000,
  "data": {
    "eventId": "evt_abc123",
    "status": "validated",
    "payout": 4500
  }
}
```

## 🔒 Verify Signatures

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hmac === signature;
}

app.post('/webhooks/growvia', (req, res) => {
  const signature = req.headers['x-growvia-signature'];
  
  if (!verifyWebhook(req.body, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  res.status(200).send('OK');
});
```

## 📚 Next Steps

- [Attribution Logic](./attribution-logic)
- [Security & Privacy](./security-privacy)
