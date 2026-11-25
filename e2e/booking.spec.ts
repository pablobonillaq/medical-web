import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { expectNoAccessibilityViolations, newPatient } from './helpers'

// The group of free times, named after the date: "Horarios disponibles el …". Only its radios:
// the header has radios too (the theme)
const timeGroup = (page: Page) => page.getByRole('group', { name: /^Horarios disponibles el / })

// The first free time, chosen by clicking its label as a person would (the radio itself is
// visually hidden), and its text ("9:00"). The first one, not a fixed time: a retried test finds
// the times it booked before already taken
const chooseFirstTime = async (page: Page) => {
  const label = timeGroup(page).locator('label').first()
  await label.click()
  await expect(label.getByRole('radio')).toBeChecked()
  return (await label.textContent()) ?? ''
}

// Each browser books on days of its own, so they never ask for the same time of the same doctor
const DAY_OFFSET = { chromium: 10, firefox: 20, webkit: 30, mobile: 40 } as const

// The day a test books on: its browser's days, plus one for the second test and two for each
// repetition (--repeat-each), which run at the same time and would take each other's first time
const bookingDay = (testInfo: TestInfo, testNumber: 0 | 1) =>
  DAY_OFFSET[testInfo.project.name as keyof typeof DAY_OFFSET] +
  testNumber +
  2 * testInfo.repeatEachIndex

// A date some days from today, as <input type="date"> writes it
const daysFromToday = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-CA')
}

test('a visitor without a session goes to sign in first', async ({ page }) => {
  await page.goto('/es/appointments/new')

  await expect(page).toHaveURL('/es/login?next=%2Fes%2Fappointments%2Fnew')
})

test('the patient books an appointment step by step and sees it', async ({ page }, testInfo) => {
  const days = bookingDay(testInfo, 0)
  await newPatient(page)
  await page.getByRole('banner').getByRole('link', { name: 'Mis citas' }).click()
  await page.getByRole('main').getByRole('link', { name: 'Agendar cita' }).click()
  await expect(page).toHaveURL('/es/appointments/new')

  // 1. The service
  await page.getByLabel('¿Qué servicio necesitas?').selectOption({ label: 'Ultrasonido' })
  await page.getByRole('button', { name: 'Continuar' }).click()

  // 2. The doctor (the only one who offers it, already chosen) and the date
  const doctorStep = page.getByRole('region', { name: '2. Médico y fecha' })
  await expect(doctorStep.getByRole('radio', { name: /Luis Ruiz/ })).toBeChecked()
  await doctorStep.getByLabel('Fecha').fill(daysFromToday(days))
  await doctorStep.getByRole('button', { name: 'Ver horarios' }).click()

  // 3. The time, in the clinic's time, and a note
  const timeStep = page.getByRole('region', { name: '3. Horario' })
  // Disabled until React hydrates (see SlotPickerForm)
  await expect(timeStep.getByRole('button', { name: 'Agendar cita' })).toBeEnabled()
  await expectNoAccessibilityViolations(page)
  const time = await chooseFirstTime(page)
  await timeStep.getByLabel('Notas para el médico').fill('Dolor abdominal')
  await timeStep.getByRole('button', { name: 'Agendar cita' }).click()

  await expect(page).toHaveURL(/\/es\/appointments\/[0-9a-f-]{36}$/)
  await expect(
    page.getByRole('status').filter({ hasText: 'Tu cita quedó agendada.' }),
  ).toBeVisible()
  const details = page.getByRole('main')
  await expect(details).toContainText('Agendada')
  await expect(details).toContainText(`${time} (hora de la Ciudad de México)`)
  await expect(details).toContainText('Luis Ruiz · Radiología')
  await expect(details).toContainText('Dolor abdominal')
  await expectNoAccessibilityViolations(page)
})

test('a booked time is no longer offered', async ({ page }, testInfo) => {
  const days = bookingDay(testInfo, 1)
  await newPatient(page)
  const step3 = `/es/appointments/new?service=0190a7b2-1111-7000-8000-000000000004&doctor=0190a7b2-2222-7000-8000-000000000003&date=${daysFromToday(days)}`
  await page.goto(step3)
  await expect(page.getByRole('button', { name: 'Agendar cita' })).toBeEnabled()
  const time = await chooseFirstTime(page)
  await page.getByRole('button', { name: 'Agendar cita' }).click()
  await expect(page).toHaveURL(/\/es\/appointments\/[0-9a-f-]{36}$/)

  await page.goto(step3)

  await expect(timeGroup(page).getByRole('radio').first()).toBeAttached()
  await expect(timeGroup(page).getByRole('radio', { name: time, exact: true })).toHaveCount(0)
})

test("someone else's appointment, or one that does not exist, is a 404", async ({ page }) => {
  await newPatient(page)

  await page.goto('/es/appointments/0190a7b2-9999-7000-8000-000000000000')

  // The appointment streams in after the heading, so the 404 shows as the not-found page
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('No encontramos esta página')
})
