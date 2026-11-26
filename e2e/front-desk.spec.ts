import { expect, test, type Page } from '@playwright/test'
import { EMPLOYEE, expectNoAccessibilityViolations, newPatient, signIn } from './helpers'

// Signs in with the front desk's fictitious account and opens the patients from the header
const openPatients = async (page: Page) => {
  await page.goto('/es/login?next=%2Fes%2Faccount')
  await signIn(page, EMPLOYEE.email, EMPLOYEE.password)
  await expect(page).toHaveURL('/es/account')
  await page.getByRole('banner').getByRole('link', { name: 'Pacientes' }).click()
  await expect(page).toHaveURL('/es/front-desk/patients')
}

const search = async (page: Page, text: string) => {
  await page.getByRole('searchbox', { name: 'Buscar paciente' }).fill(text)
  await page.getByRole('button', { name: 'Buscar' }).click()
}

test('a visitor without a session goes to sign in first', async ({ page }) => {
  await page.goto('/es/front-desk/patients')

  await expect(page).toHaveURL('/es/login?next=%2Fes%2Ffront-desk%2Fpatients')
})

test('a patient cannot open the front desk', async ({ page }) => {
  await newPatient(page)

  await page.goto('/es/front-desk/patients')

  await expect(
    page.getByRole('heading', { level: 1, name: 'No tienes acceso a esta página' }),
  ).toBeVisible()
})

test('the front desk finds a patient by name, with the search in the URL', async ({ page }) => {
  await openPatients(page)
  await expect(page.getByRole('table', { name: 'Todos los pacientes' })).toBeVisible()

  await search(page, 'ortega')

  await expect(page).toHaveURL('/es/front-desk/patients?search=ortega')
  await expect(page.getByRole('status').filter({ hasText: '1 paciente' })).toBeVisible()
  const table = page.getByRole('table', { name: 'Pacientes que coinciden con “ortega”' })
  await expect(table.getByRole('rowheader')).toHaveText(['Ortega Salas, Ramón'])
  await expectNoAccessibilityViolations(page)
})

test('the front desk finds a patient by phone, and needs 2 characters', async ({ page }) => {
  await openPatients(page)

  await search(page, '4433')
  await expect(page.getByRole('rowheader')).toHaveText(['Quiroga, Elena'])

  await search(page, 'q')
  await expect(
    page.getByRole('searchbox', { name: 'Buscar paciente' }),
  ).toHaveAccessibleDescription(/Escribe al menos 2 caracteres/)
  await expect(page.getByRole('table')).toHaveCount(0)
})
