import { defineConfig, devices } from '@playwright/test'

const PORT = 3001
const baseURL = `http://localhost:${PORT}`
const isCI = Boolean(process.env.CI)

// End-to-end tests in real browsers, against the production build: what jsdom cannot check
// (the Proxy, real focus, the theme before the first paint) and axe on every page
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // A forgotten test.only fails the run in CI
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    // The browser asks for Spanish unless a test says otherwise
    locale: 'es-MX',
    // On a retry, keep a trace to see step by step what failed
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: baseURL,
    // Locally, an app already running on port 3001 (npm run dev) is used as is
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
})
