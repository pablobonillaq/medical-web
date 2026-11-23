import { expect, test } from '@playwright/test'

// The fake API lists four services (scripts/fake-api.mjs); the home page shows the first three
test('shows the first services and leads to all of them', async ({ page }) => {
  await page.goto('/es')

  const services = page.getByRole('region', { name: 'Servicios' })
  await expect(services.getByRole('heading', { level: 3 })).toHaveText([
    'Consulta general',
    'Electrocardiograma',
    'Pediatría',
  ])

  await services.getByRole('link', { name: 'Ver todos los servicios' }).click()

  await expect(page).toHaveURL('/es/services')
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(4)
})

test('leads to the doctors and to creating an account', async ({ page }) => {
  await page.goto('/es')

  await page.getByRole('main').getByRole('link', { name: 'Conocer a los médicos' }).click()
  await expect(page).toHaveURL('/es/doctors')

  await page.goto('/es')
  await page
    .getByRole('region', { name: '¿Eres paciente?' })
    .getByRole('link', { name: 'Crear cuenta' })
    .click()
  await expect(page).toHaveURL('/es/register')
})
