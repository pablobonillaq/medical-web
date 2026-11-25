import { expect, test } from '@playwright/test'
import { expectNoAccessibilityViolations, newPatient, signIn } from './helpers'

test('a visitor without a session goes to sign in first', async ({ page }) => {
  await page.goto('/es/profile/access-log')

  await expect(page).toHaveURL('/es/login?next=%2Fes%2Fprofile%2Faccess-log')
})

test('a new patient opens it from the profile, and no one has opened their record', async ({
  page,
}) => {
  await newPatient(page)
  await page.getByRole('banner').getByRole('link', { name: 'Mi perfil' }).click()

  await page.getByRole('link', { name: 'Ver quién consultó mi expediente' }).click()

  await expect(page).toHaveURL('/es/profile/access-log')
  await expect(page.getByText('Nadie del personal ha abierto tu expediente todavía.')).toBeVisible()
})

test('the patient sees who opened their record, the latest first', async ({ page }) => {
  // The fictitious account of the fake API has a few accesses; it only reads them
  await page.goto('/es/login?next=%2Fes%2Fprofile%2Faccess-log')
  await signIn(page)
  await expect(page).toHaveURL('/es/profile/access-log')

  const table = page.getByRole('table', { name: 'Accesos a tu expediente' })
  const rows = table.getByRole('row')
  await expect(rows).toHaveCount(4)
  await expect(rows.nth(1)).toContainText('Ana Garay · Médico')
  await expect(rows.nth(1)).toContainText('Creó una nota clínica')
  await expect(rows.nth(3)).toContainText('Recepción')
  await expect(rows.nth(3)).toContainText('Intentó abrir una nota clínica sin permiso')
  await expectNoAccessibilityViolations(page)
})
