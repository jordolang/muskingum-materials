# HTTP Security Headers Documentation

This document describes the HTTP security headers configured in `next.config.ts`.

## Configured Headers

All responses from this Next.js application include the following security headers:

### 1. Content-Security-Policy (CSP)

**Purpose**: Prevents XSS attacks by controlling which resources can be loaded and executed.

**Configuration**:
```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline' [trusted domains]
script-src-elem 'self' 'unsafe-inline' [trusted domains]
worker-src 'self' blob:
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: [trusted domains]
font-src 'self' data:
connect-src 'self' [trusted domains]
frame-src 'self' [trusted domains]
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'self' [trusted Sanity domains]
upgrade-insecure-requests
```

**Trusted Domains**:
- Clerk (authentication): `*.clerk.accounts.dev`, `clerk.com`
- Stripe (payments): `js.stripe.com`, `*.stripe.com`, `api.stripe.com`
- Sanity (CMS): `cdn.sanity.io`, `*.sanity.io`, `*.sanity-cdn.com`, `*.sanity.work`, `*.sanity.build`
- Analytics: `www.googletagmanager.com`, `www.google-analytics.com`
- Images: `lh3.googleusercontent.com`, `images.unsplash.com`, `source.unsplash.com`

### 2. Strict-Transport-Security (HSTS)

**Purpose**: Forces HTTPS connections and prevents protocol downgrade attacks.

**Value**: `max-age=31536000; includeSubDomains`

**Behavior**:
- Enforces HTTPS for 1 year (31536000 seconds)
- Applies to all subdomains
- Browsers will refuse to connect over HTTP

### 3. X-Frame-Options

**Purpose**: Prevents clickjacking attacks by controlling iframe embedding.

**Value**: `SAMEORIGIN`

**Behavior**:
- Page can only be embedded in iframes from the same origin
- Provides defense-in-depth for older browsers that don't support CSP `frame-ancestors`
- Complements the `frame-ancestors 'self'` directive in CSP

### 4. X-Content-Type-Options

**Purpose**: Prevents MIME-type sniffing attacks.

**Value**: `nosniff`

**Behavior**:
- Browsers must respect the declared Content-Type
- Prevents execution of files with incorrect MIME types
- Blocks attacks that rely on MIME confusion

### 5. Referrer-Policy

**Purpose**: Controls how much referrer information is sent with requests.

**Value**: `strict-origin-when-cross-origin`

**Behavior**:
- Same-origin requests: Full URL sent as referrer
- Cross-origin HTTPS→HTTPS: Only origin (no path) sent
- Cross-origin HTTPS→HTTP: No referrer sent (downgrade protection)
- Balances privacy with functionality

### 6. Permissions-Policy

**Purpose**: Disables browser features that aren't needed.

**Value**: `camera=(), microphone=(), geolocation=(), interest-cohort=()`

**Behavior**:
- Disables camera access for all origins
- Disables microphone access for all origins
- Disables geolocation access for all origins
- Opts out of FLoC (Federated Learning of Cohorts) tracking

## Verification

### Static Verification

Run the verification script to check configuration:

```bash
node verify-headers.js
```

### Runtime Verification

#### Using curl

```bash
# Start the dev server
npm run dev

# In another terminal, check headers
curl -I http://localhost:3000

# Or check specific headers
curl -I http://localhost:3000 | grep -i "content-security-policy\|strict-transport\|x-frame-options\|x-content-type\|referrer-policy\|permissions-policy"
```

#### Using Browser DevTools

1. Open the application in your browser
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to the Network tab
4. Reload the page
5. Click on the first request (usually the HTML document)
6. Scroll to "Response Headers"
7. Verify all six security headers are present

### Expected Output

You should see all of these headers in the HTTP response:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'...
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

## Security Impact

These headers provide defense-in-depth protection against:

- **XSS (Cross-Site Scripting)**: CSP restricts script sources
- **Clickjacking**: X-Frame-Options and CSP frame-ancestors
- **MIME Sniffing Attacks**: X-Content-Type-Options
- **Protocol Downgrade**: HSTS
- **Privacy Leaks**: Referrer-Policy
- **Unwanted Feature Access**: Permissions-Policy

## Compliance

These headers help meet requirements for:

- OWASP Top 10 recommendations
- Security scanner checks
- Penetration testing requirements
- SOC 2 and similar compliance audits
- Privacy regulations (limiting tracking via Permissions-Policy)

## Maintenance Notes

### Adding New Third-Party Services

When integrating new third-party services, update the CSP directives in `next.config.ts`:

1. Identify which CSP directives the service needs
2. Add the service's domains to the appropriate directive(s)
3. Test thoroughly to ensure both functionality and security
4. Document the changes

### Common CSP Directives for Third-Party Services

- `script-src`: JavaScript files
- `style-src`: CSS files
- `img-src`: Images
- `font-src`: Web fonts
- `connect-src`: AJAX, WebSocket, fetch() API
- `frame-src`: Iframes
- `media-src`: Audio/video

### Testing CSP Changes

1. Open browser DevTools console
2. Look for CSP violation errors
3. Adjust directives as needed
4. Never use 'unsafe-inline' or 'unsafe-eval' unless absolutely necessary
5. Consider using nonces or hashes for inline scripts when possible

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: HTTP Strict Transport Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Next.js: Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
