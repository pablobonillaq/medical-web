import { expect, test } from '@playwright/test'
import { expectNoAccessibilityViolations, newPatient } from './helpers'

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
