import { test } from '@playwright/test'
import { expectNoAccessibilityViolations, saveTheme } from './helpers'

const pages = [
  { name: 'home in Spanish', path: '/es' },
  { name: 'home in English', path: '/en' },
  { name: '404 page', path: '/es/no-existe' },
  { name: 'sign-in page', path: '/es/login' },
  { name: 'sign-up page', path: '/es/register' },
  { name: 'services page', path: '/es/services' },
  { name: 'services page in English', path: '/en/services' },
  { name: 'doctors page', path: '/es/doctors' },
]

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await saveTheme(page, theme)
    })

    for (const { name, path } of pages) {
      test(`${name} has no WCAG 2.2 AA violations`, async ({ page }) => {
        await page.goto(path)

        await expectNoAccessibilityViolations(page)
      })
    }
  })
}
