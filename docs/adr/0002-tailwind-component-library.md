# 0002. Component library with Tailwind and typed variants instead of styled-components

- **Status:** accepted
- **Date:** 2026-11-11

## Context

The app needs its own component library (buttons, inputs, dialogs…) with light and dark themes. styled-components was considered first. In 2025 its maintainers moved it to maintenance mode (fixes for new React versions, no new features), and it cannot run in Server Components: every component would have to be a Client Component, with a style registry for server rendering.

## Decision

Build the library with **Tailwind CSS** and **typed variants** (one function per component that maps props such as `variant` and `size` to classes). Colors, spacing and typography are **design tokens in CSS variables**, redefined for the dark theme.

## Consequences

- One styling system for pages and components, and components can render on the server.
- Themes switch by changing CSS variables, with no re-render and no flash on load.
- Variants are typed: an invalid `variant` is a type error.
- Each component is documented and checked for accessibility in Storybook.
