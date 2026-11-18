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
  const login = page.waitForResponse('**/api/auth/login')

  await signIn(page, PATIENT.email, PATIENT.password)

  await expect(page).toHaveURL('/en')
  // What the API tells the browser to do with its session cookie. Checked on the response:
  // WebKit outside macOS reports sameSite wrongly through context.cookies()
  const setCookie = await (await login).headerValue('set-cookie')
  expect(setCookie).toMatch(/^access_token=/)
  expect(setCookie).toContain('HttpOnly')
  expect(setCookie).toContain('SameSite=Strict')
  // The browser kept it, out of reach of JavaScript
  const cookies = await context.cookies()
  expect(cookies.some(({ name }) => name === 'access_token')).toBe(true)
  expect(await page.evaluate(() => document.cookie)).not.toContain('access_token')
})

test('never sends the visitor to another site after signing in', async ({ page }) => {
  await page.goto('/es/login?next=https%3A%2F%2Fevil.example')

  await signIn(page, PATIENT.email, PATIENT.password)

  await expect(page).toHaveURL('/es')
})

test('shows who signed in and signs out', async ({ page, context }) => {
  await page.goto('/es/login')
  await signIn(page, PATIENT.email, PATIENT.password)

  const banner = page.getByRole('banner')
  await expect(banner).toContainText('paciente@test.com · Paciente')

  await banner.getByRole('button', { name: 'Cerrar sesión' }).click()

  await expect(page).toHaveURL('/es')
  await expect(banner.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  const cookies = await context.cookies()
  expect(cookies.find(({ name }) => name === 'access_token')).toBeUndefined()
})

test('the sign-in link brings the visitor back to the page', async ({ page }) => {
  await page.goto('/en')

  await page.getByRole('banner').getByRole('link', { name: 'Sign in' }).click()

  await expect(page).toHaveURL('/en/login?next=%2Fen')
})
