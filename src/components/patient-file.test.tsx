import { testAppointment } from '@mocks/appointments'
import { server } from '@mocks/node'
import { testProfile, testWalkIn } from '@mocks/patients'
import { fakeToken, testUsers } from '@mocks/session'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Appointment } from '@/appointments/types'
import { es } from '@/i18n/dictionaries/es'
import { PAST_PAGE_SIZE, PatientFile, PatientFileFallback } from './patient-file'

// Outside a Next.js request: the session and the language of the URL are set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

const signedIn = (user: (typeof testUsers)[keyof typeof testUsers] | null) => {
  const token = user && fakeToken({ sub: user.id, exp: Date.now() / 1000 + 3600 })
  vi.mocked(cookies).mockResolvedValue({
    get: () => (token ? { name: 'access_token', value: token } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>)
  vi.mocked(headers).mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>)
  server.use(
    http.get('http://localhost:3000/auth/me', () =>
      user ? HttpResponse.json({ user }) : HttpResponse.json({}, { status: 401 }),
    ),
  )
}

beforeEach(() => {
  // Only the clock, for the age: the requests still run
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-26T18:00:00.000Z'))
  signedIn(testUsers.employee)
})

afterEach(() => {
  vi.useRealTimers()
})

const past: Appointment = {
  ...testAppointment,
  id: '0190a7b2-4444-7000-8000-000000000002',
  status: 'completed',
  startsAt: '2026-10-05T16:30:00.000Z',
}

// The API answers the upcoming appointments (from=) and the past ones (to=) apart
const appointments = (
  upcoming: Appointment[],
  pastOnes: Appointment[],
  total = pastOnes.length,
) => {
  const asked: URLSearchParams[] = []
  server.use(
    http.get('http://localhost:3000/appointments', ({ request }) => {
      const query = new URL(request.url).searchParams
      asked.push(query)
      return query.has('from')
        ? HttpResponse.json({
            appointments: upcoming,
            page: 1,
            pageSize: 100,
            total: upcoming.length,
          })
        : HttpResponse.json({ appointments: pastOnes, page: 1, pageSize: PAST_PAGE_SIZE, total })
    }),
  )
  return asked
}

const file = (id = testWalkIn.id, query: Record<string, string> = {}) =>
  PatientFile({
    locale: 'es',
    labels: es.patientPage,
    statuses: es.appointmentPage.statuses,
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve(query),
  })

// What the file says next to a term: "Teléfono", "Recordatorios"
const detail = (term: string) => screen.getByText(term).nextElementSibling

describe('PatientFile', () => {
  it('shows who the patient is and how to reach them', async () => {
    appointments([], [])

    render(await file())

    expect(screen.getByRole('region', { name: 'Ramón Ortega Salas' })).toBeInTheDocument()
    expect(detail('Fecha de nacimiento')).toHaveTextContent('14 de marzo de 1958 (68 años)')
    expect(detail('Teléfono')).toHaveTextContent('+525587654321')
    expect(detail('Cuenta en línea')).toHaveTextContent('No tiene: la registró recepción')
    expect(detail('Correo para recordatorios')).toHaveTextContent('No tiene')
    expect(detail('Recordatorios')).toHaveTextContent('No quiere recordatorios')
    expect(screen.getByRole('link', { name: 'Volver a pacientes' })).toHaveAttribute(
      'href',
      '/es/front-desk/patients',
    )
  })

  it('shows the account and the reminders of a patient who signed up', async () => {
    appointments([], [])
    server.use(
      http.get('*/patients/:id', () =>
        HttpResponse.json({
          patient: {
            ...testProfile,
            contactEmail: 'luz.trabajo@test.com',
            whatsappOptIn: true,
            hasAccount: true,
          },
        }),
      ),
    )

    render(await file(testProfile.id))

    expect(detail('Cuenta en línea')).toHaveTextContent('paciente@test.com')
    expect(detail('Correo para recordatorios')).toHaveTextContent('luz.trabajo@test.com')
    expect(detail('Recordatorios')).toHaveTextContent('Correo y WhatsApp')
  })

  it('counts the years until the last birthday, a single one in the singular', async () => {
    appointments([], [])
    server.use(
      http.get('*/patients/:id', () =>
        HttpResponse.json({ patient: { ...testWalkIn, birthDate: '2024-12-01' } }),
      ),
    )

    render(await file())

    expect(detail('Fecha de nacimiento')).toHaveTextContent('(1 año)')
  })

  it("lists the patient's upcoming and past appointments", async () => {
    const asked = appointments([testAppointment], [past])

    render(await file())

    expect(asked.map((query) => query.get('patientId'))).toEqual([testWalkIn.id, testWalkIn.id])
    const upcoming = screen.getByRole('region', { name: 'Próximas citas' })
    expect(within(upcoming).getByRole('heading', { level: 3 })).toHaveTextContent(
      'jueves, 26 de noviembre de 2026, 9:00',
    )
    expect(within(upcoming).queryByRole('link')).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Citas anteriores' })).getByRole('listitem'),
    ).toHaveTextContent('Atendida')
  })

  it('says so when there are no appointments, and pages through the past ones', async () => {
    const asked = appointments([], [past], PAST_PAGE_SIZE * 2)

    render(await file(testWalkIn.id, { page: '2' }))

    expect(screen.getByText('No tiene citas próximas.')).toBeInTheDocument()
    expect(asked.find((query) => query.has('to'))?.get('page')).toBe('2')
    const pages = screen.getByRole('navigation', { name: 'Páginas de las citas anteriores' })
    expect(within(pages).getByRole('link', { name: 'Más recientes' })).toHaveAttribute(
      'href',
      `/es/front-desk/patients/${testWalkIn.id}`,
    )
  })

  it('says so when there are no past appointments', async () => {
    appointments([testAppointment], [])

    render(await file())

    expect(screen.getByText('No tiene citas anteriores.')).toBeInTheDocument()
  })

  it('answers 404 to an id that is no patient, without asking for appointments', async () => {
    const asked = appointments([], [])
    server.use(http.get('*/patients/:id', () => HttpResponse.json({}, { status: 404 })))

    await expect(file('nadie')).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' })
    expect(asked).toHaveLength(0)
  })

  it.each([
    ['the patient', '*/patients/:id'],
    ['the appointments', '*/appointments'],
  ])('explains that the file could not be loaded when %s fail', async (_, path) => {
    appointments([], [])
    server.use(http.get(path, () => HttpResponse.error()))

    render(await file())

    expect(screen.getByText('No pudimos cargar la ficha')).toBeInTheDocument()
  })

  it('answers 403 to anyone who is not from the front desk', async () => {
    signedIn(testUsers.patient)
    // forbidden() only works with experimental.authInterrupts, which sets this variable
    process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS = 'true'

    try {
      await expect(file()).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;403' })
    } finally {
      delete process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS
    }
  })

  it('sends a visitor without a session to sign in, and back here', async () => {
    signedIn(null)

    await expect(file()).rejects.toMatchObject({
      digest: expect.stringContaining(
        `;/es/login?next=%2Fes%2Ffront-desk%2Fpatients%2F${testWalkIn.id};`,
      ),
    })
  })

  it('says that the file is loading, for screen readers too', () => {
    const { container } = render(<PatientFileFallback label="Cargando la ficha…" />)

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando la ficha…')).toBeInTheDocument()
  })
})
