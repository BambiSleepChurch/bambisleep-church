# 🌸 Microsoft Clarity MCP Reference

> **BambiSleep™ Church MCP Control Tower**  
> Integration reference for Microsoft Clarity analytics

---

## Overview

Microsoft Clarity is a **free forever** behavioral analytics tool that provides:

- **Session Recordings** - Watch how users interact with your site
- **Heatmaps** - Visualize where users click, scroll, and engage
- **Smart Events** - Track user actions automatically
- **Privacy-First** - GDPR/CCPA compliant with masking controls

---

## NPM Installation

```bash
npm install @microsoft/clarity
```

### ES Module Import

```javascript
import Clarity from "@microsoft/clarity";

// Initialize with your project ID
Clarity.init("YOUR_PROJECT_ID");
```

### CommonJS Import

```javascript
const Clarity = require("@microsoft/clarity");

Clarity.init("YOUR_PROJECT_ID");
```

---

## Manual Script Installation

For non-NPM projects, add the tracking code to your HTML `<head>`:

```html
<script type="text/javascript">
  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "YOUR_PROJECT_ID");
</script>
```

---

## Clarity Client API

### Identify API

Track custom user identifiers across sessions:

```javascript
// Identify a user
Clarity.identify(customUserId, customSessionId, customPageId, friendlyName);

// Parameters:
// - customUserId: string (required) - Unique user identifier
// - customSessionId: string (optional) - Custom session identifier
// - customPageId: string (optional) - Custom page identifier
// - friendlyName: string (optional) - Human-readable name for dashboard
```

**Best Practice**: Call `identify()` on every page load for optimal tracking.

```javascript
// Example: Identify logged-in user
Clarity.identify(user.id);

// Example: Full identification
Clarity.identify(user.id, sessionToken, "checkout-page", user.displayName);
```

### Custom Tags API

Apply arbitrary tags to filter recordings and heatmaps:

```javascript
// Set a custom tag
window.clarity("set", "key", "value");

// Parameters:
// - key: string - Tag name
// - value: string | string[] - Tag value(s)
```

**Examples:**

```javascript
// Track subscription tier
window.clarity("set", "plan", "premium");

// Track user role
window.clarity("set", "role", "admin");

// Track feature flags
window.clarity("set", "feature", ["dark-mode", "beta-tester"]);

// Track page category
window.clarity("set", "category", "hypnosis-sessions");
```

### Custom Events API

Track specific user actions manually:

```javascript
// Track a custom event
Clarity.event(eventName);

// Example: Track button clicks
document.getElementById("trigger-btn").addEventListener("click", () => {
  Clarity.event("trigger_activated");
});

// Example: Track form submissions
Clarity.event("session_completed");
```

### Consent API

For sites requiring cookie consent (GDPR/CCPA):

```javascript
// V2 Consent API (Recommended)
Clarity.consentV2();
// Default: { ad_Storage: 'granted', analytics_Storage: 'granted' }

// Custom consent configuration
Clarity.consentV2({
  ad_Storage: "denied",
  analytics_Storage: "granted",
});

// V1 Consent API (Legacy)
Clarity.consent(); // Default: true
Clarity.consent(false); // Disable tracking
```

---

## Content Masking

Protect sensitive content from being recorded:

### Mask Content

```html
<!-- Mask sensitive elements -->
<div data-clarity-mask="true">
  <input type="password" />
  <span>Credit Card: ****-****-****-1234</span>
</div>

<!-- Note: Setting data-clarity-mask="false" has NO effect -->
```

### Unmask Content

```html
<!-- Unmask specific elements within masked parents -->
<div data-clarity-mask="true">
  <p data-clarity-unmask="true">This text is visible in recordings</p>
  <input type="password" />
  <!-- This remains masked -->
</div>
```

---

## Integration Patterns

### React Integration

```javascript
// src/clarity.js
import Clarity from "@microsoft/clarity";

const CLARITY_PROJECT_ID = process.env.CLARITY_PROJECT_ID;

export const initClarity = () => {
  if (typeof window !== "undefined" && CLARITY_PROJECT_ID) {
    Clarity.init(CLARITY_PROJECT_ID);
  }
};

export const identifyUser = (user) => {
  if (user?.id) {
    Clarity.identify(user.id, null, null, user.displayName);
  }
};

export const trackEvent = (eventName) => {
  Clarity.event(eventName);
};

export const setTag = (key, value) => {
  window.clarity("set", key, value);
};
```

```javascript
// App.jsx
import { useEffect } from "react";
import { initClarity, identifyUser } from "./clarity";

function App() {
  useEffect(() => {
    initClarity();
  }, []);

  useEffect(() => {
    if (currentUser) {
      identifyUser(currentUser);
    }
  }, [currentUser]);

  return <>{/* ... */}</>;
}
```

### Express.js Server-Side Tags

```javascript
// middleware/clarity-tags.js
export const clarityTagsMiddleware = (req, res, next) => {
  // Inject Clarity tags into response locals
  res.locals.clarityTags = {
    userType: req.user?.type || "anonymous",
    pageCategory: req.path.split("/")[1] || "home",
    abTest: req.cookies?.ab_variant || "control",
  };
  next();
};
```

---

## Dashboard Features

### Session Recordings

- Watch full user sessions
- Filter by custom tags, events, or user identifiers
- Jump to specific interactions (rage clicks, errors)

### Heatmaps

| Type            | Description                |
| --------------- | -------------------------- |
| **Click Maps**  | Where users click most     |
| **Scroll Maps** | How far users scroll       |
| **Area Maps**   | Engagement by page regions |

### Smart Events (Auto-Detected)

| Event                   | Description                      |
| ----------------------- | -------------------------------- |
| **Dead Clicks**         | Clicks with no response          |
| **Rage Clicks**         | Repeated frustrated clicking     |
| **Error Clicks**        | Clicks causing JavaScript errors |
| **Quick Backs**         | Rapid navigation away            |
| **Excessive Scrolling** | Unusual scroll behavior          |

---

## Google Analytics Integration

Link Clarity sessions to Google Analytics:

```javascript
// Clarity automatically integrates when GA is detected
// Sessions appear with playback links in GA reports
```

Manual linking via custom dimensions:

```javascript
// Send Clarity session ID to GA4
gtag("set", "user_properties", {
  clarity_session: window.clarity?.sessionId,
});
```

---

## MCP Server Implementation Notes

### Recommended MCP Tools for Clarity Integration

| Tool                  | Purpose                            |
| --------------------- | ---------------------------------- |
| `clarity_init`        | Initialize Clarity with project ID |
| `clarity_identify`    | Identify user across sessions      |
| `clarity_track_event` | Track custom events                |
| `clarity_set_tag`     | Set custom tags for filtering      |
| `clarity_consent`     | Handle GDPR consent                |

### Environment Variables

```bash
CLARITY_PROJECT_ID=your_project_id
CLARITY_COOKIE_DOMAIN=.yourdomain.com
```

### Server Configuration Schema

```javascript
const clarityConfig = {
  projectId: process.env.CLARITY_PROJECT_ID,
  cookieConsent: true,
  maskAllInputs: true,
  maskAllText: false,
  domains: ["yourdomain.com", "app.yourdomain.com"],
};
```

---

## Best Practices

### ✅ Do

- Call `identify()` on every page for consistent tracking
- Use custom tags to segment users (plan tier, role, features)
- Mask sensitive inputs (passwords, PII, payment info)
- Track key conversion events manually
- Review rage clicks to identify UX issues

### ❌ Don't

- Store PII in custom tag values
- Forget consent management for EU users
- Over-track events (creates noise)
- Use `data-clarity-mask="false"` (it has no effect)

---

## Resources

| Resource              | URL                                                                          |
| --------------------- | ---------------------------------------------------------------------------- |
| **NPM Package**       | https://www.npmjs.com/package/@microsoft/clarity                             |
| **Documentation**     | https://learn.microsoft.com/en-us/clarity/                                   |
| **Clarity Dashboard** | https://clarity.microsoft.com                                                |
| **Setup Guide**       | https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api |

---

**Organization:** BambiSleepChurch  
**Trademark Notice:** BambiSleep™ is a trademark of BambiSleepChurch
