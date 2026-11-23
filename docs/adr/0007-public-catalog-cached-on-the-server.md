# 0007. Public catalog: read from the API on the server and cached with `use cache`

- **Status:** accepted
- **Date:** 2026-11-20

## Context

The public pages show the clinic's services and doctors to anyone, without signing in. The API makes `GET /services` and `GET /doctors` public for this, and gives visitors a public doctor profile without account data. The catalog changes rarely (only the admin edits it) and is the same for every visitor, so fetching it on every request would waste time and API capacity. The pages also have to stay up, and the build has to finish, when the API is down: the CI build runs without the API.

## Decision

- **Read on the server, without the cookie** (`src/catalog/catalog.ts`). Server Components fetch `API_URL` directly, not `/api`, and send no session, so every visitor gets the same answer and the result can be shared.
- **Cached with `use cache`**, for hours (`cacheLife('hours')`), so the catalog is part of the prerendered page and loads with no request to the API. Each list has a tag (`cacheTag('services')`), so the admin area can refresh it right after a change.
- **Filters read the cache, not the API.** The doctors page filters by service with `?service=` in the URL (a GET form, so it can be shared and works without JavaScript). The page reads the URL, so the directory streams in behind `<Suspense>`, but it picks from the cached lists: changing the filter asks the API nothing.
- **Only what the pages show.** A Zod schema validates the answer and drops every other field, which keeps the cache small and fails safely if the API changes shape.
- **Failures are not cached for long.** If the API cannot be reached (5-second limit), fails or answers something unexpected, the function returns `null` with `cacheLife('seconds')`. That lifetime keeps the failure out of the build: the list becomes a dynamic hole behind `<Suspense>` and renders on each request, showing a warning until the API answers.
- **The catalog is written in Spanish.** The API has one language, so pages in other languages mark the catalog's texts with `lang="es"` (WCAG 3.1.2), and only the interface around them is translated.

## Consequences

- The public pages load fast and keep working while the API is down, with the last cached catalog or a clear warning.
- A change in the admin can take up to an hour to show, until the admin area (Phase 12) calls `revalidateTag`.
- Building with the API running prerenders the catalog; building without it leaves the list to be rendered on request. Both are valid.
- Translating the catalog would need the API to store each text per language.
