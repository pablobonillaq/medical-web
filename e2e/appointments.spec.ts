import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { expectNoAccessibilityViolations, newPatient } from './helpers'

// Another doctor than the booking tests' (e2e/booking.spec.ts), and days of their own, so no
// test takes another's time: some per browser, plus one for each test and each repetition
const DAY_OFFSET = { chromium: 10, firefox: 20, webkit: 30, mobile: 40 } as const
const appointmentDay = (testInfo: TestInfo, testNumber: number) =>
  DAY_OFFSET[testInfo.project.name as keyof typeof DAY_OFFSET] +
  testNumber +
  3 * testInfo.repeatEachIndex

// Books the first free pediatrics appointment with Sofía Morales that many days ahead, and
// opens it
const bookAppointment = async (page: Page, days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  await page.goto(
    `/es/appointments/new?service=0190a7b2-1111-7000-8000-000000000003&doctor=0190a7b2-2222-7000-8000-000000000002&date=${date.toLocaleDateString('en-CA')}`,
  )
  await expect(page.getByRole('button', { name: 'Agendar cita' })).toBeEnabled()
  await page
    .getByRole('group', { name: /^Horarios disponibles el / })
    .locator('label')
    .first()
    .click()
  await page.getByRole('button', { name: 'Agendar cita' }).click()
  await expect(page).toHaveURL(/\/es\/appointments\/[0-9a-f-]{36}$/)
}

const status = (page: Page) =>
  page.getByRole('term').filter({ hasText: 'Estado' }).locator('xpath=following-sibling::dd[1]')

test('a visitor without a session goes to sign in first', async ({ page }) => {
  await page.goto('/es/appointments')

  await expect(page).toHaveURL('/es/login?next=%2Fes%2Fappointments')
})

test('the patient sees their upcoming appointment and opens it', async ({
  page,
  browserName,
}, testInfo) => {
  await newPatient(page)
  await bookAppointment(page, appointmentDay(testInfo, 0))

  await page.getByRole('banner').getByRole('link', { name: 'Mis citas' }).click()

  await expect(page).toHaveURL('/es/appointments')
  const upcoming = page.getByRole('region', { name: 'Próximas' })
  await expect(upcoming.getByRole('listitem')).toHaveCount(1)
  await expect(upcoming).toContainText('Pediatría · Sofía Morales')
  await expect(
    page
      .getByRole('region', { name: 'Anteriores' })
      .getByText('Todavía no tienes citas anteriores.'),
  ).toBeVisible()
  // Playwright's Firefox crashes while axe checks this page (see the README)
  if (browserName !== 'firefox') await expectNoAccessibilityViolations(page)

  await upcoming.getByRole('link').click()
  await expect(page).toHaveURL(/\/es\/appointments\/[0-9a-f-]{36}$/)
})

test('the patient confirms an appointment, then cancels it with a reason', async ({
  page,
}, testInfo) => {
  await newPatient(page)
  await bookAppointment(page, appointmentDay(testInfo, 1))
  await expect(status(page)).toHaveText('Agendada')
  // The appointment page came from a client navigation after booking, so React already runs
  const actions = page.getByRole('region', { name: 'Tu asistencia' })
  await expect(actions.getByRole('button', { name: 'Confirmar asistencia' })).toBeVisible()

  await actions.getByRole('button', { name: 'Confirmar asistencia' }).click()

  await expect(status(page)).toHaveText('Confirmada')
  await expect(actions.getByRole('button', { name: 'Confirmar asistencia' })).toHaveCount(0)

  await actions.getByRole('button', { name: 'Cancelar cita' }).click()
  const dialog = page.getByRole('dialog', { name: '¿Cancelar esta cita?' })
  await expect(dialog).toBeVisible()
  await expectNoAccessibilityViolations(page)
  await dialog.getByLabel('Motivo').fill('Viaje de trabajo')
  await dialog.getByRole('button', { name: 'Sí, cancelar' }).click()

  await expect(dialog).toBeHidden()
  await expect(status(page)).toHaveText('Cancelada')
  await expect(page.getByRole('region', { name: 'Tu asistencia' })).toHaveCount(0)
})

test('Escape closes the cancel dialog and keeps the appointment', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the mobile project has no keyboard')
  await newPatient(page)
  await bookAppointment(page, appointmentDay(testInfo, 2))
  // From the keyboard, as a keyboard user does: WebKit does not focus a button on click
  await page.getByRole('button', { name: 'Cancelar cita' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(status(page)).toHaveText('Agendada')
  await expect(page.getByRole('button', { name: 'Cancelar cita' })).toBeFocused()
})
