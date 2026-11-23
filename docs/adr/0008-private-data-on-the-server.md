# 0008. Private data: read on the server with the visitor's session, changed through thunks

- **Status:** accepted
- **Date:** 2026-11-23

## Context

The patient area shows data that belongs to one person: their profile, their appointments, who opened their record. It must never be cached for other visitors, and it must keep working with Cache Components, where reading a cookie is request-time data. The pages also change that data (saving the profile, booking or cancelling an appointment), and the result has to show right away.

## Decision

- **Reads on the server** (`src/api/server.ts`). Server Components call `serverApiRequest()`, which asks the API (`API_URL`) with the visitor's session cookie and address, the way `getSession()` already did; `getSession()` now uses it too. The answer is never cached, and failures are `ApiError`s, as in the browser.
- **Behind `<Suspense>`, after `requireSession()`.** Each private section checks the session and the role first (signed out goes to sign in, another role gets a 403), then reads its data. The page's heading stays in the static shell and the section streams in.
- **Changes in the browser, through thunks** (ADR 0003). Forms validate with the API's rules, send the change to `/api`, and on success call `router.refresh()`: the server reads the data again and the page shows what the API saved, with no copy of it kept in the store.
- **Forms start over with the saved data.** A form gets a `key` from the record's `updatedAt`, so after a save it is created again with the values the API answered.

## Consequences

- The data shown always comes from the API, read once per page view, and no cache can leak it to someone else.
- A change costs two requests: the change itself and the new read after `router.refresh()`. That is the price of a single source of truth.
- The store only holds the state of each request (saving, the error), not the records.
