import { expect, test } from '@playwright/test'

// The fake API has three doctors; only Ana Garay offers "Electrocardiograma" (scripts/fake-api.mjs)
test('lists the doctors without signing in', async ({ page }) => {
  await page.goto('/es')

  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Médicos' })
    .click()

  await expect(page).toHaveURL('/es/doctors')
  await expect(page.getByRole('heading', { level: 1, name: 'Médicos' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'médicos' })).toHaveText('3 médicos')
  const card = page.getByRole('listitem').filter({ hasText: 'Luis Ruiz' })
  await expect(card).toContainText('Cédula profesional: 7654321')
  await expect(card.getByRole('list', { name: 'Servicios' })).toContainText('Ultrasonido')
})

test('filters by service, with the filter in the URL', async ({ page }) => {
  await page.goto('/es/doctors')
  // exact: the cards' lists are "Servicios", which also contains "Servicio"
  const filter = page.getByRole('combobox', { name: 'Servicio', exact: true })
  await filter.selectOption({ label: 'Electrocardiograma' })

  await page.getByRole('button', { name: 'Filtrar' }).click()

  await expect(page).toHaveURL(/\/es\/doctors\?service=0190a7b2-1111-7000-8000-000000000002$/)
  await expect(page.getByRole('status').filter({ hasText: 'médico' })).toHaveText('1 médico')
  await expect(page.getByRole('heading', { level: 2, name: 'Ana Garay' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Luis Ruiz' })).toBeHidden()
  await expect(filter).toHaveValue('0190a7b2-1111-7000-8000-000000000002')
})

test('each service links to the doctors who offer it', async ({ page }) => {
  await page.goto('/es/services')

  await page.getByRole('link', { name: 'Ver médicos de Pediatría' }).click()

  await expect(page).toHaveURL(/\/es\/doctors\?service=0190a7b2-1111-7000-8000-000000000003$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Sofía Morales' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Ana Garay' })).toBeHidden()
})
