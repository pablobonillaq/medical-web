import { expect, test } from '@playwright/test'
import { saveTheme } from './helpers'

test('the saved theme is on <html> before the page is painted', async ({ page }) => {
  await saveTheme(page, 'dark')

  // DOMContentLoaded comes before React hydrates: the theme script in <head> already ran
  await page.goto('/es', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('the chosen theme applies at once and stays after a reload', async ({ page }) => {
  await page.goto('/es')

  // The options are disabled until React hydrates (see ThemeSwitcher)
  await expect(page.getByRole('radio', { name: 'Oscuro' })).toBeEnabled()
  // The radio button itself is visually hidden: the visitor clicks its label
  await page.locator('label', { hasText: 'Oscuro' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('radio', { name: 'Oscuro' })).toBeChecked()
})

test("the system theme follows the operating system's dark mode", async ({ page }) => {
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  await page.goto('/es')
  await expect(page.locator('html')).not.toHaveAttribute('data-theme')

  await page.emulateMedia({ colorScheme: 'light' })
  const light = await background()
  await page.emulateMedia({ colorScheme: 'dark' })
  const dark = await background()

  expect(dark).not.toBe(light)
})
