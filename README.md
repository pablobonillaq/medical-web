**English** | [Español](README.es.md)

# Medical Web

[![CI](https://github.com/pablobonillaq/medical-web/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/pablobonillaq/medical-web/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=pablobonillaq_medical-web&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=pablobonillaq_medical-web)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=pablobonillaq_medical-web&metric=coverage)](https://sonarcloud.io/summary/new_code?id=pablobonillaq_medical-web)

Web client for [Medical API](https://github.com/pablobonillaq/medical-api): appointment booking, medical records, files and chat with the clinic's front desk, for patients, doctors, front desk staff and admins. Accessible, in Spanish and English, with light and dark themes.

> **Status:** in development. Phase 1 (base setup) completed; Phase 2 (design system) in progress.
> Portfolio project. All test data is **fictitious**.

## Features

- [x] Light, dark or system theme, with no flash on load
- [ ] Component library with typed variants, documented in Storybook
- [ ] Spanish and English (`/es`, `/en`)
- [ ] Sign in, patient sign-up and sign-out; routes protected by role on the server
- [ ] Public pages: home, services and doctors
- [ ] Patients: book, cancel, reschedule and confirm appointments; see who opened their record
- [ ] Front desk: patient search, walk-in patients, booking for a patient, daily agenda
- [ ] Doctors: agenda, weekly schedule and time off, attendance
- [ ] Medical records: history, SOAP notes with amendments, files
- [ ] Real-time chat between patients and the front desk
- [ ] Admin: users, services, doctors and audit log
- [ ] Accessibility: WCAG 2.2 AA as the target (see [Accessibility](#accessibility))

## Tech stack

- **Framework:** Next.js 16 (App Router, Cache Components), React 19, TypeScript
- **Styles:** Tailwind CSS 4, with design tokens in CSS variables
- **Validation:** Zod
- **Testing:** Vitest, Testing Library and V8 coverage
- **Code quality:** ESLint and Prettier
- **CI:** GitHub Actions and SonarQube Cloud
- **Coming soon:** Redux Toolkit with thunks and sagas, Storybook, Playwright with axe, Lighthouse CI

## Requirements

- Node.js 22 or later
- npm
- [Medical API](https://github.com/pablobonillaq/medical-api) running locally (port 3000)

## Getting started

```bash
git clone <repository-url>
cd medical-web
npm install
cp .env.example .env   # API_URL points to the API on port 3000
npm run dev
```

Open `http://localhost:3001`. The API keeps port 3000, so both run at the same time.

The browser never calls the API directly: requests to `/api/...` are forwarded by the Next.js server to `API_URL` (for example, `/api/health` → `http://localhost:3000/health`). Web and API share one origin, so CORS is not needed and the API's httpOnly session cookie works as is.

## Environment variables

| Variable  | Description                                                            | Example                 |
| --------- | ---------------------------------------------------------------------- | ----------------------- |
| `API_URL` | Where the Express API runs. Only the Next.js server uses it (`/api/*`) | `http://localhost:3000` |

Variables are validated with Zod when the app starts (`src/config/env.ts`): a wrong value stops it with a clear message.

## Scripts

| Command                 | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `npm run dev`           | Starts the development server on port 3001                     |
| `npm run build`         | Builds the app for production                                  |
| `npm start`             | Serves the production build on port 3001                       |
| `npm run typecheck`     | Generates the route types and type-checks the code             |
| `npm run lint`          | Lints the code with ESLint                                     |
| `npm run format`        | Formats the code with Prettier (and sorts Tailwind classes)    |
| `npm run check`         | Runs typecheck, lint, the format check and the tests           |
| `npm test`              | Runs the tests                                                 |
| `npm run test:watch`    | Runs the tests in watch mode                                   |
| `npm run test:coverage` | Runs the tests and generates the coverage report (`coverage/`) |

## Testing

Tests use **Vitest** with **Testing Library** and live next to the code they test (`*.test.ts(x)`). Components are queried by role and accessible name, the way a screen reader finds them.

Coverage is kept at **100%** of lines, branches, functions and statements, and `npm run test:coverage` fails if any of them drops. Vitest cannot render `async` Server Components yet, so those stay thin (they only load data and pass props) and the logic lives in functions and components that can be unit tested. The pages themselves will be covered by end-to-end tests with Playwright (see [ADR 0004](docs/adr/0004-testing-strategy.md)).

### Continuous integration

On every push to `master` and every pull request, [GitHub Actions](.github/workflows/ci.yml) runs the type check, ESLint, the Prettier check, the tests with coverage and the production build. The coverage report is then sent to **SonarQube Cloud**, which checks the Quality Gate.

## Accessibility

The goal is **WCAG 2.2 level AA**. The color tokens are tested: every text color has at least 4.5:1 contrast and every border and focus ring 3:1, in both themes (`src/app/globals.test.ts`). Every feature is done only when:

- it can be used with the keyboard alone, with a visible focus;
- it uses semantic HTML (landmarks, headings, labels) and announces changes with `aria-live` where needed;
- its contrast passes in both themes, and it respects `prefers-reduced-motion`;
- its automated accessibility checks (axe) pass.

## Project structure

```
.github/
└── workflows/ci.yml       # CI: types, lint, format, tests, build and SonarQube
docs/
└── adr/                   # architecture decision records
src/
├── app/                   # routes (App Router)
│   ├── globals.css        # Tailwind and design tokens (light-dark() colors)
│   ├── globals.test.ts    # checks the WCAG contrast of every color pair, in both themes
│   ├── layout.tsx         # root layout: language, fonts, metadata, theme script
│   └── page.tsx           # home page
├── components/
│   ├── theme-switcher.tsx # light, dark or system, as native radio buttons
│   └── ui/                # component library
│       ├── button.tsx     # variants, sizes and an accessible loading state
│       ├── skip-link.tsx  # "skip to main content", the first stop of the keyboard
│       └── visually-hidden.tsx # text only for screen readers
├── config/
│   ├── env.ts             # environment variables validated with Zod
│   └── rewrites.ts        # forwards /api/* to the Express API
├── lib/
│   └── cn.ts              # joins classes and resolves Tailwind conflicts
└── theme/
    ├── theme.ts           # read, save and apply the theme, and the script that runs before paint
    └── use-theme.ts       # React hook, kept in sync across tabs
next.config.ts             # Next.js configuration (Cache Components, rewrites)
vitest.config.mts          # tests and the 100% coverage threshold
```

## Architecture decisions

| ADR                                                 | Decision                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| [0001](docs/adr/0001-nextjs-app-router.md)          | Next.js App Router with Cache Components, same origin as the API                |
| [0002](docs/adr/0002-tailwind-component-library.md) | Component library with Tailwind and typed variants instead of styled-components |
| [0003](docs/adr/0003-redux-thunks-and-sagas.md)     | Redux Toolkit: thunks for requests, sagas for long-running flows                |
| [0004](docs/adr/0004-testing-strategy.md)           | Testing strategy and 100% coverage                                              |

## Roadmap

1. ~~Base setup: Next.js, Prettier, Vitest with 100% coverage, CI and SonarQube, connection to the API~~ ✅
2. Design system: tokens, light and dark themes, component library, Storybook — in progress
3. Languages and app shell: Spanish and English, layout and navigation by role, Playwright with axe, Lighthouse CI
4. Data layer: Redux Toolkit store, API client, thunks, sagas and MSW
5. Authentication: sign in, sign-up, sign-out, protected routes, session expiry
6. Public pages: home, services and doctors
7. Patient area: profile, booking, my appointments, access log
8. Front desk: patient search, walk-in patients, booking for a patient, daily agenda
9. Doctor area: agenda, schedule and time off, attendance
10. Medical records: history, clinical notes, files
11. Real-time chat
12. Admin: users, services, doctors and audit log
13. Deployment
