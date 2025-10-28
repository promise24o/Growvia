---
sidebar_position: 3
title: Quick Setup (CDN)
---

# Quick Setup (CDN)

## 📦 Installation

Add the Growvia tracking script to your website:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
    <!-- Add Growvia SDK -->
    <script 
        src="https://cdn.growvia.io/growvia.min.js" 
        data-growvia-key="your_organization_id"
        async
    ></script>
</head>
<body>
    <!-- Your content -->
</body>
</html>
```

## ⚙️ Configuration

### Basic Setup

```html
<script 
    src="https://cdn.growvia.io/growvia.min.js" 
    data-growvia-key="org_123456"
    data-api-endpoint="https://track.growvia.io"
    data-auto-track="true"
    async
></script>
```

### Advanced Configuration

```html
<script>
window.growviaConfig = {
  organizationKey: 'org_123456',
  apiEndpoint: 'https://track.growvia.io',
  autoTrackPageViews: true,
  autoTrackClicks: true,
  cookieDomain: '.yourdomain.com',
  cookieTTL: 604800, // 7 days
  debug: false
};
</script>
<script src="https://cdn.growvia.io/growvia.min.js" async></script>
```

## 🎯 Track Events

### Automatic Tracking

The SDK automatically tracks:
- Page views
- Affiliate link clicks
- Session data

### Manual Event Tracking

```html
<script>
// Track signup
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    growvia.trackSignup({
        userId: '123',
        email: 'user@example.com'
    }).then(function(response) {
        console.log('Signup tracked:', response);
        // Submit form
        e.target.submit();
    });
});

// Track purchase
function onCheckoutComplete(order) {
    growvia.trackPurchase({
        orderId: order.id,
        amount: order.total,
        currency: 'NGN',
        userId: order.userId
    });
}

// Track custom event
growvia.trackCustom('form_submit', {
    metadata: {
        formType: 'contact',
        leadScore: 85
    }
});
</script>
```

## 🔗 Affiliate Links

### Generate Tracking Links

```
https://yoursite.com?aff_id=affiliate123&camp_id=campaign456
```

### URL Parameters

- `aff_id` - Affiliate ID (required)
- `camp_id` - Campaign ID (required)
- `sub_id` - Sub-affiliate ID (optional)
- `source` - Traffic source (optional)

### Example

```html
<a href="https://yoursite.com/product?aff_id=aff_123&camp_id=camp_456">
    Buy Now
</a>
```

## 🧪 Testing

### Enable Debug Mode

```html
<script>
window.growviaConfig = {
    organizationKey: 'org_123456',
    debug: true // Enable console logging
};
</script>
```

### Test Events

```javascript
// Open browser console
growvia.trackSignup({
    userId: 'test_123',
    email: 'test@example.com'
});

// Check response
// ✓ Event tracked successfully
```

## 🎨 Examples

### E-commerce Site

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.growvia.io/growvia.min.js" 
            data-growvia-key="org_123456"></script>
</head>
<body>
    <button onclick="trackAddToCart()">Add to Cart</button>
    <button onclick="trackPurchase()">Checkout</button>
    
    <script>
    function trackAddToCart() {
        growvia.trackCustom('add_to_cart', {
            metadata: { productId: '789', price: 5000 }
        });
    }
    
    function trackPurchase() {
        growvia.trackPurchase({
            orderId: 'ORDER_' + Date.now(),
            amount: 5000,
            currency: 'NGN'
        });
    }
    </script>
</body>
</html>
```

### SaaS Application

```html
<script src="https://cdn.growvia.io/growvia.min.js" 
        data-growvia-key="org_123456"></script>

<script>
// Track trial signup
function onTrialSignup(user) {
    growvia.trackSignup({
        userId: user.id,
        email: user.email,
        metadata: { plan: 'trial' }
    });
}

// Track subscription
function onSubscribe(subscription) {
    growvia.trackPurchase({
        orderId: subscription.id,
        amount: subscription.price,
        currency: 'USD',
        metadata: { plan: subscription.plan }
    });
}
</script>
```

## 🔒 Privacy & GDPR

### Respect Do Not Track

```javascript
window.growviaConfig = {
    organizationKey: 'org_123456',
    respectDoNotTrack: true
};
```

### Anonymize IP

```javascript
window.growviaConfig = {
    organizationKey: 'org_123456',
    anonymizeIp: true
};
```

### Cookie Consent

```javascript
// Wait for consent before initializing
if (userHasConsented()) {
    growvia.init();
}
```

## 📚 Next Steps

- [Quick Setup (NPM)](./quick-setup-npm)
- [API Authentication](./api-authentication)
- [Track Clicks and Visits](../tutorial/track-clicks-visits)
