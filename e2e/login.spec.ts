import { expect, test, type Page } from '@playwright/test'
import { expectNoAccessibilityViolations } from './helpers'

// The fictitious account the fake API accepts (scripts/fake-api.mjs)
const PATIENT = { email: 'paciente@test.com', password: '12345678' }

const signIn = async (page: Page, email: string, password: string) => {
  // Disabled until React hydrates (see LoginForm)
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled()
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
}

test('explains the errors next to the fields, with no violations', async ({ page }) => {
  await page.goto('/es/login')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Iniciar sesión')
  // Disabled until React hydrates (see LoginForm)
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled()

  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  await expect(page.getByLabel('Correo electrónico')).toBeFocused()
  await expect(page.getByText('Escribe tu correo electrónico.')).toBeVisible()
  await expectNoAccessibilityViolations(page)
})

test('announces wrong credentials', async ({ page }) => {
  await page.goto('/es/login')

  await signIn(page, PATIENT.email, 'wrong-password')

  // Inside main: the live regions of the toasts are also alerts
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'El correo o la contraseña no coinciden',
  )
  await expect(page).toHaveURL('/es/login')
})

test('signs in and goes back to the page in ?next=', async ({ page, context }) => {
  await page.goto('/es/login?next=%2Fen')

  await signIn(page, PATIENT.email, PATIENT.password)

  await expect(page).toHaveURL('/en')
  // The API set its session cookie, out of reach of JavaScript
  const cookie = (await context.cookies()).find(({ name }) => name === 'access_token')
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Strict' })
})

test('never sends the visitor to another site after signing in', async ({ page }) => {
  await page.goto('/es/login?next=https%3A%2F%2Fevil.example')

  await signIn(page, PATIENT.email, PATIENT.password)

  await expect(page).toHaveURL('/es')
})
