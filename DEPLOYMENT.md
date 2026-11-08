# RollCall – Deployment, Installation & Standalone PWA Guide

RollCall is architected to run anywhere modern web standards are supported — on Android smartphones, iPhones, Windows, Mac, Linux, and Chromebooks.

---

## 🌐 Application URLs

- **Public Shared Link (Once Shared)**: `https://ais-pre-77mkgbnlv2haaguuixrahj-722978092860.europe-west2.run.app`
- **Development Applet Link**: `https://ais-dev-77mkgbnlv2haaguuixrahj-722978092860.europe-west2.run.app`

---

## 📱 Mobile Installation Instructions (Android Chrome)

### Step 1: Open the Application
Open Google Chrome on your Android mobile device and enter the production URL:
```text
https://ais-pre-qtyh6oey555zp2ilymcb6f-263109095263.europe-west2.run.app
```

### Step 2: Install as Standalone Application
1. Tap the in-app **"Install App / መተግበሪያውን ጫን"** banner at the top of the screen, or tap Chrome's three-dot menu (**⋮**) in the top right corner.
2. Select **"Add to Home screen"** or **"Install App"**.
3. Choose **Install**.

### Step 3: Launch from Mobile Home Screen
The **RollCall** app icon will appear directly on your Android home screen alongside your native apps. When opened:
- The app runs in **standalone mode** with its own task window in the Android App Switcher.
- The Chrome browser URL bar, tabs, and navigation controls are hidden.
- Hardware navigation bars and gesture safe areas are respected.
- The app continues to work even when disconnected from the internet via its Service Worker cache.

---

## 💻 Desktop Installation Instructions (Chrome / Edge)

1. Open the URL in Google Chrome or Microsoft Edge on your computer.
2. Click the **Install** icon in the browser address bar (right side next to the bookmark star).
3. Click **Install**.
4. RollCall will launch in a dedicated desktop window and add a shortcut to your desktop and Start menu.

---

## ⚙️ Building for Self-Hosted Web Servers

To host RollCall on your own Apache, Nginx, Firebase Hosting, GitHub Pages, or Docker container:

```bash
# Build the production bundle
npm run build
```

This outputs static files into the `dist/` directory:
- `dist/index.html`
- `dist/assets/*.js`
- `dist/assets/*.css`
- `dist/manifest.json`
- `dist/sw.js`

Deploy the contents of `dist/` to any static hosting provider. Configure rewrite rules to route all non-file URLs to `/index.html` (SPA fallback).
