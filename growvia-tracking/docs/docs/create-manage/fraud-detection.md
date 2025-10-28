---
sidebar_position: 4
title: Fraud Detection Settings
---

# Fraud Detection Settings

## 🛡️ Available Rules

### Conversion Delay
Minimum time between click and conversion:
```
Minimum: 0-30 days
Recommended: 1 day for signups, 0 for purchases
```

### IP Restriction
Limit conversions per IP:
```
- None
- Unique per conversion
- Unique per day
```

### Device Fingerprinting
Detect suspicious device patterns

### Duplicate Prevention
Block duplicate email/phone conversions

### Geo Targeting
Allow/block specific countries:
```
Allowed: NG, GH, KE
Blocked: None
```

### Order Value Limits
```
Minimum: ₦1000
Maximum: ₦100000
```

### Behavioral Analysis
```
Minimum time on site: 30 seconds
Minimum page views: 2
```

### Velocity Checks
```
Max conversions per hour: 10
Alert threshold: 20
```

## ⚙️ Configuration

1. Go to Campaign → Fraud Detection
2. Enable/disable rules
3. Set thresholds
4. Save settings

## 📚 Next Steps

- [Budget Intelligence](./budget-intelligence)
- [Attribution Logic](../developer-integration/attribution-logic)
