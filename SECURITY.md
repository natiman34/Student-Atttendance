# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x.x   | ✅ Yes    |
| 1.x.x   | ❌ No     |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly:

1. **Do not** create a public GitHub issue for security vulnerabilities
2. Email us directly at **security@rollcall.app** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Security Considerations

### Data Storage
- All data is stored locally in the browser's `localStorage`
- No data is transmitted to external servers by default
- Backups are user-initiated JSON exports stored locally

### PWA Security
- Service Worker uses HTTPS-only scope
- Content Security Policy headers recommended on deployment
- Manifest specifies minimal required permissions

### Dependencies
- Regular dependency audits via `npm audit`
- Automated Dependabot alerts for vulnerable packages
- Pin exact versions in `package-lock.json`

### Mobile (Capacitor)
- No native permissions requested beyond basic storage
- Android/iOS builds inherit web security model
- No custom native code with elevated privileges

## Best Practices for Deployers

When deploying RollCall:

1. **Use HTTPS** — Required for PWA features and Service Workers
2. **Set Security Headers**:
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self';
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   Referrer-Policy: strict-origin-when-cross-origin
   Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
   ```
3. **Configure Netlify/Vercel** — Use their built-in header configuration
4. **Regular Updates** — Keep dependencies updated; run `npm audit fix` periodically

## Disclosure Timeline

- **Day 0**: Vulnerability reported
- **Day 1-2**: Acknowledgment and initial assessment
- **Day 7**: Status update and estimated fix timeline
- **Day 30**: Target for patch release (may vary by severity)
- **Post-fix**: Public disclosure after users have time to update

## Hall of Fame

We recognize responsible disclosure contributions:

<!-- Security researchers who have reported vulnerabilities will be listed here -->

---

**Thank you for helping keep RollCall secure!** 🔒