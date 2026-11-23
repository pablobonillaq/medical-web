import { expect, test, type Page } from '@playwright/test'
import { expectNoAccessibilityViolations, signIn } from './helpers'

// A patient of its own for each test, so the tests of every browser can change a profile at once
const newPatient = async (page: Page) => {
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

test('a visitor without a session goes to sign in first', async ({ page }) => {
  await page.goto('/es/profile')

  await expect(page).toHaveURL('/es/login?next=%2Fes%2Fprofile')
})

test('the patient opens their profile from the header, with what they signed up with', async ({
  page,
}) => {
  const email = await newPatient(page)

  await page.getByRole('banner').getByRole('link', { name: 'Mi perfil' }).click()

  await expect(page).toHaveURL('/es/profile')
  await expect(page.getByLabel('Teléfono celular')).toHaveValue('5512345678')
  await expect(page.getByLabel('Correo para recordatorios')).toHaveAccessibleDescription(
    `Déjalo vacío para recibirlos en el correo de tu cuenta: ${email}.`,
  )
  await expectNoAccessibilityViolations(page)
})

test('saves the changes, which are still there after reloading', async ({ page }) => {
  await newPatient(page)
  await page.goto('/es/profile')
  // Disabled until React hydrates (see ProfileForm)
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled()

  await page.getByLabel('Teléfono celular').fill('55 8765 4321')
  await page.getByLabel('Quiero recibir recordatorios por WhatsApp').check()
  await page.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect(page.getByRole('status').filter({ hasText: 'Guardamos tus cambios.' })).toBeVisible()
  // router.refresh() reads the profile again and the form starts over with what the API saved:
  // the phone comes back as its 10 digits. Reloading before that would cut the refresh short
  await expect(page.getByLabel('Teléfono celular')).toHaveValue('5587654321')

  await page.reload()
  await expect(page.getByLabel('Teléfono celular')).toHaveValue('5587654321')
  await expect(page.getByLabel('Quiero recibir recordatorios por WhatsApp')).toBeChecked()
})
