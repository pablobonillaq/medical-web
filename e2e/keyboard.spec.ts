import { expect, test } from '@playwright/test'

// The mobile project has no keyboard to test
test.skip(({ isMobile }) => isMobile, 'keyboard navigation is checked on desktop browsers')

test('the first Tab reaches the skip link, which jumps to the main content', async ({
  page,
  browserName,
}) => {
  // Safari only moves the focus to links with Tab when "Press Tab to highlight each item" is on
  test.skip(browserName === 'webkit', 'WebKit skips links with Tab by default')
  await page.goto('/es')

  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Saltar al contenido principal' })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()

  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
})

test('the theme options change with the arrow keys', async ({ page }) => {
  await page.goto('/es')
  const system = page.getByRole('radio', { name: 'Sistema' })
  // The options are disabled until React hydrates (see ThemeSwitcher)
  await expect(system).toBeEnabled()

  await system.focus()
  await page.keyboard.press('ArrowLeft')

  await expect(page.getByRole('radio', { name: 'Oscuro' })).toBeChecked()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
