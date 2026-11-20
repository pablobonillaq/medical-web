import { expect, test } from '@playwright/test'

// The fake API lists four services (scripts/fake-api.mjs)
test('the main navigation leads to the services, without signing in', async ({ page }) => {
  await page.goto('/es')

  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Servicios' })
    .click()

  await expect(page).toHaveURL('/es/services')
  await expect(page.getByRole('heading', { level: 1, name: 'Servicios' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Servicios' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page).toHaveTitle('Servicios | Clínica')
})

test('lists each service with its duration', async ({ page }) => {
  await page.goto('/es/services')

  const services = page.getByRole('main').getByRole('listitem')
  await expect(services).toHaveCount(4)
  await expect(services.first()).toContainText('Consulta general')
  await expect(services.first()).toContainText('Duración: 30 minutos')
  await expect(page.getByRole('heading', { level: 2, name: 'Ultrasonido' })).toBeVisible()
})

test('in English, the catalog stays in Spanish and says so with lang', async ({ page }) => {
  await page.goto('/en/services')

  await expect(page.getByRole('heading', { level: 1, name: 'Services' })).toBeVisible()
  const name = page.getByRole('heading', { level: 2, name: 'Consulta general' })
  await expect(name).toHaveAttribute('lang', 'es')
  await expect(page.getByRole('main').getByRole('listitem').first()).toContainText(
    'Duration: 30 minutes',
  )
})
