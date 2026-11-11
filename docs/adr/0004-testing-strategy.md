# 0004. Testing strategy and 100% coverage

- **Status:** accepted
- **Date:** 2026-11-11

## Context

The project requires 100% coverage, checked in CI and in SonarQube Cloud. Vitest cannot render `async` Server Components yet; the Next.js documentation recommends end-to-end tests for them.

## Decision

- **Unit and component tests** with Vitest and Testing Library, with a coverage threshold of 100% for lines, branches, functions and statements over all of `src/`. Components are queried by role and accessible name.
- **Thin async Server Components:** they only load data and pass props. Logic lives in functions, hooks and components that Vitest can render.
- **End-to-end tests** with Playwright for pages and main flows, with automated accessibility checks (axe), against the real API in CI.
- **No coverage exclusions to reach the number.** Code that can never run is removed instead.

## Consequences

- Coverage measures the logic honestly, and the pages are still tested, end to end.
- Server Components have to stay simple, which also keeps them easy to read.
