import { testAvailability } from '@mocks/appointments'
import { testDoctors, testServices } from '@mocks/catalog'
import { server } from '@mocks/node'
import { fakeToken, testUsers } from '@mocks/session'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/toast'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { StoreProvider } from '@/store/store-provider'
import { BookingSteps, BookingStepsFallback } from './booking-steps'

// Outside a Next.js request: the session, language, cache, router and <Form> are set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
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
  signedIn()
  server.use(
    http.get('http://localhost:3000/auth/me', () => HttpResponse.json({ user: testUsers.patient })),
  )
})

const [general, ultrasound] = testServices
const [garay, ruiz] = testDoctors

const steps = (
  query: Record<string, string | string[] | undefined> = {},
  locale: 'es' | 'en' = 'es',
) =>
  BookingSteps({
    locale,
    labels: locale === 'es' ? es.bookingPage : en.bookingPage,
    searchParams: Promise.resolve(query),
  })

const renderSteps = async (...args: Parameters<typeof steps>) =>
  render(
    <StoreProvider>
      <ToastProvider>{await steps(...args)}</ToastProvider>
    </StoreProvider>,
  )

const step = (name: string) => screen.queryByRole('region', { name })

describe('BookingSteps', () => {
  it('starts with the service, in a form that keeps the choice in the URL', async () => {
    await renderSteps()

    const service = step('1. Servicio')!
    const select = within(service).getByRole('combobox', { name: '¿Qué servicio necesitas?' })
    expect(select.closest('form')).toHaveAttribute('action', '/es/appointments/new')
    expect(select).toHaveAttribute('name', 'service')
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Elige un servicio', 'Consulta general', 'Ultrasonido'])
    expect(step('2. Médico y fecha')).not.toBeInTheDocument()
  })

  it('then offers the doctors of that service and a date from today on', async () => {
    await renderSteps({ service: ultrasound.id })

    const doctor = step('2. Médico y fecha')!
    expect(within(doctor).getByRole('group', { name: 'Médico' })).toBeInTheDocument()
    expect(
      within(doctor)
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual([ruiz.id])
    // A radio group always has a choice: the first doctor
    expect(within(doctor).getByRole('radio', { name: /Luis Ruiz/ })).toBeChecked()
    const date = within(doctor).getByLabelText(/Fecha/)
    expect(date).toHaveAttribute('type', 'date')
    expect(date).toHaveAttribute('min', date.getAttribute('value'))
    expect(doctor.querySelector('input[type="hidden"][name="service"]')).toHaveValue(ultrasound.id)
    expect(step('3. Horario')).not.toBeInTheDocument()
  })

  it('keeps the doctor chosen before', async () => {
    await renderSteps({ service: general.id, doctor: ruiz.id })

    expect(screen.getByRole('radio', { name: /Luis Ruiz/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Ana Garay/ })).not.toBeChecked()
  })

  it('says so when no doctor offers the service', async () => {
    server.use(http.get('*/doctors', () => HttpResponse.json({ doctors: [garay] })))

    await renderSteps({ service: ultrasound.id })

    expect(
      within(step('2. Médico y fecha')!).getByText(/ningún médico ofrece este servicio/),
    ).toBeInTheDocument()
  })

  it("finally shows the doctor's free times on the date, in the clinic's time", async () => {
    let url: URL | undefined
    server.use(
      http.get('http://localhost:3000/availability', ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(testAvailability)
      }),
    )

    await renderSteps({ service: ultrasound.id, doctor: ruiz.id, date: '2026-11-26' })

    const time = step('3. Horario')!
    expect(
      within(time).getByRole('group', {
        name: 'Horarios disponibles el jueves, 26 de noviembre de 2026',
      }),
    ).toBeInTheDocument()
    expect(
      within(time)
        .getAllByRole('radio')
        .map((radio) => radio.parentElement?.textContent),
    ).toEqual(['9:00', '9:45'])
    expect(url?.searchParams.get('doctorId')).toBe(ruiz.id)
    expect(url?.searchParams.get('serviceId')).toBe(ultrasound.id)
  })

  it('writes the times as each language does', async () => {
    await renderSteps({ service: ultrasound.id, doctor: ruiz.id, date: '2026-11-26' }, 'en')

    expect(screen.getByRole('radio', { name: '9:00 AM' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Ultrasonido' })).toHaveAttribute('lang', 'es')
  })

  it('ignores a doctor who does not offer the service', async () => {
    await renderSteps({ service: ultrasound.id, doctor: garay.id, date: '2026-11-26' })

    expect(step('3. Horario')).not.toBeInTheDocument()
  })

  it('says so when there are no free times that day', async () => {
    server.use(
      http.get('*/availability', () => HttpResponse.json({ ...testAvailability, slots: [] })),
    )

    await renderSteps({ service: ultrasound.id, doctor: ruiz.id, date: '2026-11-26' })

    expect(
      screen.getByText('No hay horarios libres ese día. Prueba con otra fecha.'),
    ).toBeInTheDocument()
  })

  it('asks for a date in range when the API does not accept it', async () => {
    server.use(http.get('*/availability', () => HttpResponse.json({}, { status: 400 })))

    await renderSteps({ service: ultrasound.id, doctor: ruiz.id, date: '2020-01-01' })

    expect(screen.getByText(/^Elige una fecha entre hoy y el /)).toBeInTheDocument()
  })

  it('explains that the times could not be loaded when the API fails', async () => {
    server.use(http.get('*/availability', () => HttpResponse.error()))

    await renderSteps({ service: ultrasound.id, doctor: ruiz.id, date: '2026-11-26' })

    expect(screen.getByText('No pudimos cargar la información para agendar')).toBeInTheDocument()
  })

  it('explains that booking is not possible without the catalog', async () => {
    server.use(http.get('*/services', () => HttpResponse.error()))

    await renderSteps()

    expect(screen.getByText('No pudimos cargar la información para agendar')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('sends a visitor without a session to sign in', async () => {
    signedIn(false)

    await expect(steps()).rejects.toMatchObject({
      digest: expect.stringContaining(';/es/login?next=%2Fes%2Fappointments%2Fnew;'),
    })
  })

  it('says that the steps are loading, for screen readers too', () => {
    const { container } = render(<BookingStepsFallback label="Cargando…" />)

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
  })
})
