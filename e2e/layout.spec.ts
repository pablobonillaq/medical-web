import { expect, test } from '@playwright/test'

test('every page has a banner, a main region and a footer', async ({ page }) => {
  await page.goto('/es')

  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('contentinfo')).toBeVisible()
})

// WCAG 1.4.10 Reflow: at 320 CSS pixels wide nothing should need a horizontal scroll
test('fits a 320 px wide screen without a horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/es')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

// The whole data path: the store dispatches a thunk, the client calls /api/health, Next.js
// forwards it to the API (the fake one in CI) and the footer shows the answer
test('the footer shows that the service is available', async ({ page }) => {
  await page.goto('/es')

  await expect(page.getByRole('contentinfo')).toContainText('Servicio disponible')
})
