import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
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
// says what to fix
export const expectNoAccessibilityViolations = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  const problems = violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`),
  )
  expect(problems).toEqual([])
}

// The fictitious account the fake API accepts (scripts/fake-api.mjs)
export const PATIENT = { email: 'paciente@test.com', password: '12345678' }

// Fills in and sends the sign-in form of the page that is open
export const signIn = async (page: Page, email = PATIENT.email, password = PATIENT.password) => {
  // Disabled until React hydrates (see LoginForm)
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled()
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
}
