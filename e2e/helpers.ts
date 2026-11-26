import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import { SESSION_COOKIE } from '../src/auth/constants'
import { THEME_STORAGE_KEY, type ThemePreference } from '../src/theme/theme'

// Saves the theme before the page loads, as a visitor who chose it on an earlier visit
export const saveTheme = async (page: Page, theme: ThemePreference) => {
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value)
    },
    [THEME_STORAGE_KEY, theme],
  )
}

// The WCAG 2.2 A and AA rules of axe. Problems are listed by rule and element, so a failure
// says what to fix. The Firefox that Playwright installs crashes ("Page crashed") while axe
// checks pages with a session, on different pages from run to run (see the README): there, axe
// runs in the other browsers only. Pages without a session are checked in Firefox too
export const expectNoAccessibilityViolations = async (page: Page) => {
  const browser = page.context().browser()?.browserType().name()
  const cookies = await page.context().cookies()
  if (browser === 'firefox' && cookies.some(({ name }) => name === SESSION_COOKIE)) return

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  const problems = violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`),
  )
  expect(problems).toEqual([])
}

// The fictitious accounts the fake API accepts (scripts/fake-api.mjs)
export const PATIENT = { email: 'paciente@test.com', password: '12345678' }
export const EMPLOYEE = { email: 'recepcion@clinica.test', password: '12345678' }

// Fills in and sends the sign-in form of the page that is open
export const signIn = async (page: Page, email = PATIENT.email, password = PATIENT.password) => {
  // Disabled until React hydrates (see LoginForm)
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled()
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
}

// A patient of its own for each test, signed in: the tests of every browser run at once against
// the same fake API, and must not change each other's data
export const newPatient = async (page: Page) => {
  const email = `luz.${Date.now()}.${Math.floor(Math.random() * 1e6)}@test.com`
  const response = await page.request.post('/api/auth/register', {
    data: {
      email,
      password: '12345678',
      firstName: 'Luz',
      lastName: 'Méndez',
      birthDate: '1990-05-21',
      phone: '5512345678',
      emailRemindersOptIn: true,
      whatsappOptIn: false,
    },
  })
  expect(response.status()).toBe(201)
  // Without ?next= the sign-in page goes home; the account page shows the session has started
  await page.goto('/es/login?next=%2Fes%2Faccount')
  await signIn(page, email)
  await expect(page).toHaveURL('/es/account')
  return email
}
