import { expect, test } from '@playwright/test'
import { expectNoAccessibilityViolations, signIn } from './helpers'

test('a protected page sends a visitor without a session to sign in and back', async ({ page }) => {
  const response = await page.goto('/es/account')

  // The Proxy redirected before rendering anything
  expect(response?.request().redirectedFrom()?.url()).toMatch(/\/es\/account$/)
  await expect(page).toHaveURL('/es/login?next=%2Fes%2Faccount')

  await signIn(page)

  await expect(page).toHaveURL('/es/account')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mi cuenta')
  await expect(page.getByRole('main')).toContainText('paciente@test.com')
  await expect(page.getByRole('main')).toContainText('Paciente')
  await expectNoAccessibilityViolations(page)
})

test('the header links to the account page', async ({ page }) => {
  await page.goto('/es/login')
  await signIn(page)

  await page.getByRole('banner').getByRole('link', { name: 'Mi cuenta' }).click()

  await expect(page).toHaveURL('/es/account')
})
