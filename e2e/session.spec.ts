import { expect, test, type Page } from '@playwright/test'
import { expectNoAccessibilityViolations, signIn } from './helpers'

// The browser's clock is faked, so an hour of session passes in an instant. The fake API's
// sessions last an hour (scripts/fake-api.mjs)
const signInToAccount = async (page: Page) => {
  await page.clock.install()
  await page.goto('/es/login?next=%2Fes%2Faccount')
  await signIn(page)
  await expect(page).toHaveURL('/es/account')
}

const warning = (page: Page) => page.getByRole('dialog', { name: 'Tu sesión está por terminar' })

test('warns two minutes before the session ends, in a modal dialog', async ({ page }) => {
  await signInToAccount(page)
  await expect(warning(page)).toBeHidden()

  await page.clock.fastForward('58:30')

  await expect(warning(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Seguir aquí' })).toBeVisible()
  await expectNoAccessibilityViolations(page)
})

test('the warning closes with Escape, and the visitor keeps working', async ({ page }) => {
  await signInToAccount(page)
  await page.clock.fastForward('58:30')
  await expect(warning(page)).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(warning(page)).toBeHidden()
  await expect(page).toHaveURL('/es/account')
})

test('when the session ends, a protected page goes to sign in and says why', async ({ page }) => {
  await signInToAccount(page)
  await page.clock.fastForward('58:30')
  await page.getByRole('button', { name: 'Seguir aquí' }).click()

  await page.clock.fastForward('02:00')

  await expect(page).toHaveURL('/es/login?next=%2Fes%2Faccount')
  await expect(
    page.getByRole('alert').filter({ hasText: 'Tu sesión terminó. Inicia sesión de nuevo' }),
  ).toBeVisible()
})
