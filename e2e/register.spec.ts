import { expect, test, type Page } from '@playwright/test'
import { PATIENT } from './helpers'

// A fictitious patient with an email of its own, so the tests of every browser can run at once
const newEmail = () => `ana.${Date.now()}.${Math.floor(Math.random() * 1e6)}@test.com`

const fillIn = async (page: Page, email: string) => {
  // Disabled until React hydrates (see RegisterForm)
  await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled()
  // By its accessible name: the label's text also holds the required star, hidden from screen
  // readers, so getByLabel with exact: true would look for "Nombre *"
  await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Ana')
  await page.getByLabel('Apellidos').fill('García López')
  await page.getByLabel('Fecha de nacimiento').fill('1990-05-21')
  await page.getByLabel('Teléfono celular').fill('55 1234 5678')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña').fill('12345678')
  await page.getByLabel('Quiero recibir recordatorios por correo').check()
}

test('explains the errors and moves the focus to the first one', async ({ page }) => {
  await page.goto('/es/register')
  await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled()

  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toBeFocused()
  await expect(page.getByText('Escribe tu nombre.')).toBeVisible()
})

test('creates the account, signs in and opens it', async ({ page }) => {
  const email = newEmail()
  await page.goto('/es/register')
  await fillIn(page, email)

  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page).toHaveURL('/es/account')
  await expect(page.getByRole('main')).toContainText(email)
  await expect(page.getByRole('banner')).toContainText(`${email} · Paciente`)
})

test('announces an email that already has an account', async ({ page }) => {
  await page.goto('/es/register')
  await fillIn(page, PATIENT.email)

  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  // Inside main: the live regions of the toasts are also alerts
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Ya existe una cuenta con ese correo',
  )
  await expect(page).toHaveURL('/es/register')
})

test('links between signing in and creating an account', async ({ page }) => {
  await page.goto('/es/login')

  await page.getByRole('link', { name: 'Crea una cuenta de paciente' }).click()
  await expect(page).toHaveURL('/es/register')

  await page.getByRole('main').getByRole('link', { name: 'Inicia sesión' }).click()
  await expect(page).toHaveURL('/es/login')
})
