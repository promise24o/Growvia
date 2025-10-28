---
sidebar_position: 1
title: Track Clicks and Visits
---

# Track Clicks and Visits

## 🖱️ Automatic Click Tracking

The SDK automatically tracks affiliate link clicks:

```html
<script src="https://cdn.growvia.io/growvia.min.js" 
        data-growvia-key="org_123456"
        data-auto-track="true"></script>

<!-- Clicks are automatically tracked -->
<a href="/?aff_id=aff_123&camp_id=camp_456">Visit Site</a>
```

## �� Affiliate Link Format

```
https://yoursite.com?aff_id=AFFILIATE_ID&camp_id=CAMPAIGN_ID
```

### Required Parameters

- `aff_id` - Affiliate ID
- `camp_id` - Campaign ID

### Optional Parameters

- `sub_id` - Sub-affiliate ID
- `source` - Traffic source
- `medium` - Marketing medium
- `content` - Ad content identifier

### Example

```
https://shop.example.com/products?aff_id=aff_123&camp_id=camp_456&source=instagram
```

## 📄 Track Page Visits

```javascript
// Automatic (enabled by default)
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  autoTrackPageViews: true
});

// Manual
growvia.trackPageView();

// With metadata
growvia.trackCustom('page_view', {
  metadata: {
    page: '/products',
    category: 'electronics'
  }
});
```

## 🎯 Track Specific Actions

```javascript
// Track button click
document.getElementById('cta-button').addEventListener('click', () => {
  growvia.trackCustom('cta_click', {
    metadata: { button: 'hero_cta' }
  });
});

// Track form view
growvia.trackCustom('form_view', {
  metadata: { formType: 'contact' }
});

// Track video play
growvia.trackCustom('video_play', {
  metadata: { videoId: 'intro_video' }
});
```

## 📊 Session Tracking

Sessions are automatically tracked:

```javascript
// Get current session ID
const sessionId = growvia.getSessionId();

// Get visitor ID
const visitorId = growvia.getVisitorId();

// Get attribution data
const attribution = growvia.getAttribution();
console.log(attribution);
// {
//   affiliateId: 'aff_123',
//   campaignId: 'camp_456',
//   clickId: 'clk_789',
//   timestamp: 1234567890
// }
```

## 🍪 Cookie Management

### Default Behavior

```javascript
// Cookies are set automatically
// - growvia_visitor_id (1 year)
// - growvia_session_id (30 minutes)
// - growvia_attribution (7 days)
```

### Custom Configuration

```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  cookieDomain: '.yourdomain.com',
  cookieTTL: 2592000, // 30 days
  cookiePath: '/',
  cookieSecure: true,
  cookieSameSite: 'Lax'
});
```

## 🧪 Testing

### Test Click Tracking

1. Add affiliate parameters to URL:
```
http://localhost:3000?aff_id=test_aff&camp_id=test_camp
```

2. Open browser console
3. Check cookies:
```javascript
document.cookie
// Should see growvia_attribution cookie
```

4. Verify in dashboard

### Debug Mode

```javascript
const growvia = new GrowviaSDK({
  organizationKey: 'org_123456',
  debug: true
});

// Console will show:
// ✓ Click tracked
// ✓ Session started
// ✓ Page view tracked
```

## 📚 Next Steps

- [Track Signups and Purchases](./track-signups-purchases)
- [Custom Events](./custom-events)
- [Validating Conversions](./validating-conversions)
