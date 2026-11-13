# 0005. Spanish and English with Next.js routing and typed dictionaries, no library

- **Status:** accepted
- **Date:** 2026-11-12

## Context

The app must work in Spanish and English, with a URL per language (`/es`, `/en`) that can be shared and indexed. Libraries such as next-intl add ICU messages and hooks for client components, but also a dependency with its own configuration, and they take time to support new Next.js features such as Cache Components and `next/root-params`. The app has two languages and short texts, and most of its pages render on the server.

## Decision

Follow the **Next.js internationalization guide** with no library:

- Every route lives under `app/[lang]`, prerendered for both languages with `generateStaticParams`.
- The **Proxy** redirects URLs without a language: the one used last time (a cookie), else the browser's (`Accept-Language`), else Spanish.
- Texts live in **typed dictionaries**: Spanish is the reference type, English must match it.
- Server Components read the language with **`next/root-params`**, without passing it as a prop; client components get their texts as props.
- Plurals, dates and numbers use the native `Intl` APIs when needed.

## Consequences

- No extra dependency, and the texts stay on the server: no translation JavaScript in the browser.
- A missing or misspelled text is a type error, and a test checks that both languages have the same keys.
- Client components cannot read the dictionary on their own: their texts come from the page.
- Adding a language means one dictionary and one entry in `LOCALES`.
