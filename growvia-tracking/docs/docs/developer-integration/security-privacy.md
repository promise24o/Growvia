---
sidebar_position: 5
title: Security & Data Privacy
---

# Security & Data Privacy

## 🔒 Data Security

### HTTPS Only
All tracking requests use HTTPS encryption.

### API Authentication
Organization keys and API tokens for authentication.

### HMAC Signatures
Webhook signatures prevent tampering.

## 🛡️ Privacy Features

### IP Anonymization
```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  anonymizeIp: true
});
```

### Do Not Track
```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  respectDoNotTrack: true
});
```

### Cookie Consent
```javascript
if (userHasConsented()) {
  growvia.init();
}
```

## 📋 GDPR Compliance

- Data minimization
- User consent management
- Right to be forgotten
- Data portability
- Transparent data usage

## 🇳🇬 NDPR Compliance

- Data protection principles
- Consent requirements
- Data subject rights
- Security measures

## 📚 Next Steps

- [Deployment](../deployment/deploy-docs)
- [API Reference](../../api/overview)
