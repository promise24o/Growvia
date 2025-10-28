---
sidebar_position: 5
title: API Authentication
---

# API Authentication

## 🔑 Organization Key

Your organization key identifies your account:

```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456789'
});
```

### Get Your Key

1. Log in to [Growvia Dashboard](https://app.growvia.com)
2. Go to Settings → API Keys
3. Copy your Organization Key

## 🎫 API Tokens

For server-to-server authentication:

```bash
curl -X POST https://track.growvia.io/api/v1/track \
  -H "Authorization: Bearer your_api_token" \
  -H "Content-Type: application/json" \
  -d '{"type": "purchase", ...}'
```

### Generate API Token

```bash
growvia tokens create --name "Production API"
```

## 🔒 Security Best Practices

### Client-Side (Browser)

```javascript
// ✅ Safe - Organization key only
const growvia = new GrowviaSDK({
  organizationKey: process.env.REACT_APP_GROWVIA_KEY
});
```

### Server-Side (Node.js)

```javascript
// ✅ Safe - Use environment variables
const growvia = new GrowviaSDK({
  organizationKey: process.env.GROWVIA_ORG_KEY,
  apiToken: process.env.GROWVIA_API_TOKEN
});
```

### ❌ Never Do This

```javascript
// ❌ Don't hardcode keys
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456789' // Exposed in source code!
});

// ❌ Don't commit keys to Git
// Add to .gitignore:
// .env
// .env.local
```

## 🌍 Environment Variables

### React

```bash
# .env
REACT_APP_GROWVIA_KEY=org_123456789
```

### Next.js

```bash
# .env.local
NEXT_PUBLIC_GROWVIA_KEY=org_123456789
GROWVIA_API_TOKEN=token_secret
```

### Node.js

```bash
# .env
GROWVIA_ORG_KEY=org_123456789
GROWVIA_API_TOKEN=token_secret
```

## 🔐 HMAC Signatures

Verify webhook authenticity:

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
  const isValid = verifyWebhook(
    req.body,
    signature,
    process.env.GROWVIA_WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
});
```

## 📚 Next Steps

- [Track Clicks and Visits](../tutorial/track-clicks-visits)
- [Developer Integration](../developer-integration/javascript-sdk)
- [Security & Privacy](../developer-integration/security-privacy)
