---
sidebar_position: 3
title: Versioning & Updates
---

# Versioning & Updates

## 📦 SDK Versioning

### Semantic Versioning

```
v1.2.3
│ │ │
│ │ └─ Patch: Bug fixes
│ └─── Minor: New features (backward compatible)
└───── Major: Breaking changes
```

### Version-Specific CDN URLs

```html
<!-- Latest version -->
<script src="https://cdn.growvia.io/growvia.min.js"></script>

<!-- Specific version -->
<script src="https://cdn.growvia.io/v1.2.3/growvia.min.js"></script>

<!-- Major version -->
<script src="https://cdn.growvia.io/v1/growvia.min.js"></script>
```

## 📖 Documentation Versions

```bash
# Create new version
npm run docusaurus docs:version 1.0.0

# Versions stored in:
# - versions.json
# - versioned_docs/
# - versioned_sidebars/
```

## 🔄 Update Strategy

### Breaking Changes
- Major version bump
- Migration guide
- Deprecation warnings

### New Features
- Minor version bump
- Update documentation
- Announce in changelog

### Bug Fixes
- Patch version bump
- Update changelog

## 📚 Next Steps

- [Congratulations](../next-steps/congratulations)
- [Support](../next-steps/support)
