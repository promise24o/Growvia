---
sidebar_position: 2
title: Deploy Tracking CDN
---

# Deploy Tracking CDN

## 🌐 CDN Setup

### Build SDK

```bash
cd packages/sdk
npm run build
# Output: dist/growvia.min.js
```

### Upload to CDN

```bash
# AWS S3 + CloudFront
aws s3 cp dist/growvia.min.js s3://cdn.growvia.io/
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"

# Cloudflare
wrangler publish

# Vercel
vercel --prod
```

## 🔧 Configuration

### CORS Headers

```javascript
// Allow tracking from any domain
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### Caching

```
Cache-Control: public, max-age=31536000, immutable
```

## 📚 Next Steps

- [Versioning](./versioning)
- [Congratulations](../next-steps/congratulations)
