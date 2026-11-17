import { test } from '@playwright/test'
import { expectNoAccessibilityViolations, saveTheme } from './helpers'

const pages = [
  { name: 'home in Spanish', path: '/es' },
  { name: 'home in English', path: '/en' },
  { name: '404 page', path: '/es/no-existe' },
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
