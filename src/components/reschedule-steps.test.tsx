import { testAppointment, testAvailability } from '@mocks/appointments'
import { server } from '@mocks/node'
import { fakeToken, testUsers } from '@mocks/session'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/toast'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { StoreProvider } from '@/store/store-provider'
import { RescheduleSteps, RescheduleStepsFallback } from './reschedule-steps'

// Outside a Next.js request: the session, language, router and <Form> are set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/form', () => ({ default: (props: object) => <form {...props} /> }))
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
}))

const signedIn = (signedInUser: boolean = true) => {
  const token = fakeToken({ sub: testUsers.patient.id, exp: Date.now() / 1000 + 3600 })
  vi.mocked(cookies).mockResolvedValue({
    get: () => (signedInUser ? { name: 'access_token', value: token } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>)
  vi.mocked(headers).mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>)
}

beforeEach(() => {
  // Two days before the test appointment (November 26, 2026, 9:00 at the clinic). Only the
  // clock: the requests still run
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-24T18:00:00.000Z'))
  signedIn()
  server.use(
    http.get('http://localhost:3000/auth/me', () => HttpResponse.json({ user: testUsers.patient })),
  )
})

afterEach(() => {
  vi.useRealTimers()
})

// The free times the API was asked for
const availabilityAsked = () => {
  const asked: URLSearchParams[] = []
  server.use(
    http.get('http://localhost:3000/availability', ({ request }) => {
      asked.push(new URL(request.url).searchParams)
      return HttpResponse.json(testAvailability)
    }),
  )
  return asked
}

const steps = (query: Record<string, string> = {}, locale: 'es' | 'en' = 'es') =>
  RescheduleSteps({
    locale,
    labels: locale === 'es' ? es.reschedulePage : en.reschedulePage,
    params: Promise.resolve({ id: testAppointment.id }),
    searchParams: Promise.resolve(query),
  })

const renderSteps = async (...args: Parameters<typeof steps>) =>
  render(
    <StoreProvider>
      <ToastProvider>{await steps(...args)}</ToastProvider>
    </StoreProvider>,
  )

describe('RescheduleSteps', () => {
  it('shows the appointment and the other free times of its day, with the same doctor', async () => {
    const asked = availabilityAsked()

    await renderSteps()

    const current = screen.getByRole('region', { name: 'Tu cita ahora' })
    expect(current).toHaveTextContent('jueves, 26 de noviembre de 2026, 9:00')
    expect(current).toHaveTextContent('Ultrasonido · Luis Ruiz')
    expect(screen.getByLabelText(/Fecha/)).toHaveValue('2026-11-26')
    expect(Object.fromEntries(asked[0])).toEqual({
      doctorId: testAppointment.doctor.id,
      serviceId: testAppointment.service.id,
      date: '2026-11-26',
    })
    // 9:00 is the current time: only 9:45 is offered
    const times = screen.getByRole('region', { name: '2. Nuevo horario' })
    expect(within(times).getAllByRole('radio')).toHaveLength(1)
    expect(
      within(times).getByRole('group', {
        name: 'Horarios disponibles el jueves, 26 de noviembre de 2026',
      }),
    ).toBeInTheDocument()
    expect(within(times).getByRole('radio', { name: '9:45' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a tu cita' })).toHaveAttribute(
      'href',
      `/es/appointments/${testAppointment.id}`,
    )
  })

  it('asks for the free times of the date in the URL, from today until 90 days ahead', async () => {
    const asked = availabilityAsked()

    await renderSteps({ date: '2026-11-27' })

    expect(asked[0].get('date')).toBe('2026-11-27')
    const date = screen.getByLabelText(/Fecha/)
    expect(date).toHaveValue('2026-11-27')
    expect(date).toHaveAttribute('min', '2026-11-24')
    expect(date).toHaveAttribute('max', '2027-02-22')
    expect(date.closest('form')).toHaveAttribute(
      'action',
      `/es/appointments/${testAppointment.id}/reschedule`,
    )
  })

  it('says so when there is no other free time that day', async () => {
    server.use(
      http.get('*/availability', () =>
        HttpResponse.json({ ...testAvailability, slots: testAvailability.slots.slice(0, 1) }),
      ),
    )

    await renderSteps()

    expect(screen.getByText(/No hay otros horarios libres ese día/)).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('asks for another date when the API does not accept it', async () => {
    server.use(
      http.get('*/availability', () =>
        HttpResponse.json({ error: 'date cannot be in the past' }, { status: 400 }),
      ),
    )

    await renderSteps({ date: '2020-01-01' })

    expect(
      screen.getByText('Elige una fecha entre hoy y el lunes, 22 de febrero de 2027.'),
    ).toBeInTheDocument()
  })

  it('explains that the times could not be loaded when the API fails', async () => {
    server.use(http.get('*/availability', () => HttpResponse.error()))

    await renderSteps()

    expect(screen.getByText('No pudimos cargar tu cita')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tu cita ahora' })).toBeInTheDocument()
  })

  it.each([
    ['less than 2 hours away', { startsAt: '2026-11-24T19:00:00.000Z' }],
    ['cancelled', { status: 'cancelled' }],
  ])('offers no new time for an appointment %s', async (_, change) => {
    const asked = availabilityAsked()
    server.use(
      http.get('*/appointments/:id', () =>
        HttpResponse.json({ appointment: { ...testAppointment, ...change } }),
      ),
    )

    await renderSteps()

    expect(screen.getByText('Esta cita ya no se puede cambiar')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Fecha/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a tu cita' })).toBeInTheDocument()
    expect(asked).toHaveLength(0)
  })

  it('writes the dates as each language does and marks the catalog as Spanish', async () => {
    await renderSteps({}, 'en')

    expect(screen.getByRole('region', { name: 'Your appointment now' })).toHaveTextContent(
      'Thursday, November 26, 2026, 9:00 AM',
    )
    expect(screen.getByText('Ultrasonido')).toHaveAttribute('lang', 'es')
    expect(screen.getByRole('radio', { name: '9:45 AM' })).toBeInTheDocument()
  })

  it('explains that the appointment could not be loaded when the API fails', async () => {
    server.use(http.get('*/appointments/:id', () => HttpResponse.error()))

    await renderSteps()

    expect(screen.getByText('No pudimos cargar tu cita')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tu cita ahora' })).not.toBeInTheDocument()
  })

  it("answers 404 to an appointment that is someone else's or does not exist", async () => {
    server.use(http.get('*/appointments/:id', () => HttpResponse.json({}, { status: 404 })))

    await expect(steps()).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' })
  })

  it('sends a visitor without a session to sign in, and back here', async () => {
    signedIn(false)

    await expect(steps()).rejects.toMatchObject({
      digest: expect.stringContaining(
        `;/es/login?next=%2Fes%2Fappointments%2F${testAppointment.id}%2Freschedule;`,
      ),
    })
  })

  it('says that the appointment is loading, for screen readers too', () => {
    const { container } = render(<RescheduleStepsFallback label="Cargando tu cita…" />)

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando tu cita…')).toBeInTheDocument()
  })
})
