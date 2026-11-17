import { expect, test } from '@playwright/test'

test.describe('a URL without a language', () => {
  test("goes to the browser's language, keeping the path and the query", async ({ page }) => {
    await page.goto('/no-existe?dia=lunes')

    await expect(page).toHaveURL('/es/no-existe?dia=lunes')
  })

  test.describe('with an English browser', () => {
    test.use({ locale: 'en-US' })

    test('goes to English', async ({ page }) => {
      await page.goto('/')

      await expect(page).toHaveURL('/en')
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    })
  })

  test('goes to the language used last time', async ({ page }) => {
    await page.goto('/en')
    await page.goto('/')

    await expect(page).toHaveURL('/en')
  })
})

test('the language switcher opens the same page in the other language', async ({ page }) => {
  await page.goto('/es')

  await page
    .getByRole('navigation', { name: 'Idioma' })
    .getByRole('link', { name: 'English' })
    .click()

  await expect(page).toHaveURL('/en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Clinic')
  await expect(page).toHaveTitle('Clinic')
})

test('an address that matches no page answers 404, in the language of the URL', async ({
  page,
}) => {
  const response = await page.goto('/en/no-such-page')

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("We couldn't find this page")
  await expect(page.getByRole('banner')).toBeVisible()
})
