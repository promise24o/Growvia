---
sidebar_position: 4
title: Attribution Logic
---

# Attribution Logic

## 🎯 Attribution Models

### Last-Click (Default)
Credits the last affiliate click before conversion.

```
Click 1 (Day 1) → Click 2 (Day 3) → Conversion (Day 5)
Credit: Click 2 (100%)
```

### First-Click
Credits the first affiliate click.

```
Click 1 (Day 1) → Click 2 (Day 3) → Conversion (Day 5)
Credit: Click 1 (100%)
```

### Linear
Distributes credit equally.

```
Click 1 (Day 1) → Click 2 (Day 3) → Conversion (Day 5)
Credit: Click 1 (50%), Click 2 (50%)
```

### Time-Decay
More credit to recent clicks.

```
Click 1 (Day 1) → Click 2 (Day 3) → Conversion (Day 5)
Credit: Click 1 (25%), Click 2 (75%)
```

## ⏱️ Conversion Window

Default: 7 days (604800 seconds)

```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  conversionWindow: 2592000 // 30 days
});
```

## 🔍 How It Works

1. User clicks affiliate link
2. Cookie is set with attribution data
3. User converts within window
4. System finds matching click
5. Applies attribution model
6. Credits affiliate(s)

## 📚 Next Steps

- [Security & Privacy](./security-privacy)
- [API Reference](../../api/overview)
