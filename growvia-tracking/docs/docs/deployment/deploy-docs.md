---
sidebar_position: 1
title: Deploy Growvia Docs
---

# Deploy Growvia Docs

## 🚀 Vercel (Recommended)

```bash
npm install -g vercel
cd docs
vercel
```

### Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "docusaurus"
}
```

## 🌐 Netlify

```bash
# Build command
npm run build

# Publish directory
build
```

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 📦 GitHub Pages

```bash
# Set in docusaurus.config.ts
organizationName: 'growvia'
projectName: 'growvia-tracking'

# Deploy
npm run deploy
```

## 🐳 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "serve"]
```

## 📚 Next Steps

- [Deploy Tracking CDN](./deploy-tracking-cdn)
- [Versioning](./versioning)
