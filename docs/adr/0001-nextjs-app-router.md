# 0001. Next.js App Router with Cache Components, on the same origin as the API

- **Status:** accepted
- **Date:** 2026-11-11

## Context

The clinic needs a web client for four roles (patient, doctor, front desk, admin). Most pages depend on who is signed in, a few are public (home, services, doctors), and the API keeps the session in an httpOnly, `SameSite=Strict` cookie. The same API will later serve a React Native app.

## Decision

Use **Next.js with the App Router**, with `cacheComponents` enabled, and serve the web client on the **same origin** as the API: the Next.js server forwards `/api/*` to the API with rewrites.

## Consequences

- No CORS, and the session cookie keeps working unchanged: the browser only sees one origin.
- The server can read the session before sending a page, so protected pages redirect to sign-in and a patient never receives the HTML of a doctor's panel.
- Server Components send ready HTML: content reaches screen readers and slow phones without waiting for JavaScript, and less JavaScript is shipped.
- With Cache Components everything is dynamic by default and caching is explicit (`'use cache'`). Code that reads the session (`cookies()`) must sit inside a `<Suspense>` boundary.
- The API sees the Next.js server as its client. To keep per-client rate limits and audit IPs right, the API must trust one proxy hop (`TRUST_PROXY=1`) and must not be reachable directly in production.
- Mobile apps are not browsers and do not use CORS; how they send the session is decided when that app starts.
