# 0006. Session: the API's httpOnly cookie, read on the server through a Data Access Layer

- **Status:** accepted
- **Date:** 2026-11-18

## Context

The Express API already handles sign-in: `POST /auth/login` sets an httpOnly cookie (`access_token`, a JWT that lasts one hour) and `GET /auth/me` says who it belongs to. The web app needs to know who is signed in to render pages by role, protect routes and warn before the session ends. It also has to work with Cache Components, where reading a cookie is request-time data.

## Decision

- **No second session.** The web app keeps no session of its own (no iron-session, no NextAuth). Web and API share one origin through the `/api/*` rewrites, so the browser sends the API's cookie on every request, and JavaScript never sees the token.
- **A Data Access Layer** (`src/auth/session.ts`): `getSession()` is the only code that reads the session on the server. It reads the cookie and asks the API (`GET /auth/me`) who it belongs to, so a forged, expired or revoked token counts as signed out. React `cache()` makes it one request to the API per page render.
- **Only what pages need:** the session holds the user's id, email and role, and when it expires. The expiry is read from the token's payload without checking the signature, only to warn the user in time; the API checks the signature on every request.
- **Request-time reads behind `<Suspense>`:** components that read the session stream in, and the rest of the page stays in the static shell.
- **The visitor's address is forwarded** (`X-Forwarded-For`) so the API's rate limits count the visitor, not the web server.

## Consequences

- One source of truth for authentication: the API. Signing out or disabling a user in the API takes effect on the next page.
- Every page that reads the session costs one request to the API. If that becomes a problem, the result can be cached per session with `use cache: private`.
- There is no refresh token, so a session cannot be extended: the app warns two minutes before it ends and asks the user to sign in again.
