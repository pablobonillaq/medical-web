import { testAppointment } from '@mocks/appointments'
import { server } from '@mocks/node'
import { fakeToken, testUsers } from '@mocks/session'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { AppointmentDetails, AppointmentDetailsFallback } from './appointment-details'

// Outside a Next.js request: the session and the language of the URL are set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

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

const details = (id = testAppointment.id, locale: 'es' | 'en' = 'es') =>
  AppointmentDetails({
    locale,
    labels: locale === 'es' ? es.appointmentPage : en.appointmentPage,
    params: Promise.resolve({ id }),
  })

// Each term with its description, as a screen reader reads the list
const terms = () =>
  Object.fromEntries(
    screen
      .getAllByRole('term')
      .map((term) => [term.textContent, term.nextElementSibling?.textContent]),
  )

describe('AppointmentDetails', () => {
  it("shows the appointment in the patient's language and the clinic's time", async () => {
    render(await details())

    expect(terms()).toEqual({
      Estado: 'Agendada',
      Fecha: 'jueves, 26 de noviembre de 2026',
      Hora: '9:00 (hora de la Ciudad de México)',
      Servicio: 'Ultrasonido · 45 minutos',
      Médico: 'Luis Ruiz · Radiología',
    })
    expect(screen.getByRole('link', { name: 'Agendar otra cita' })).toHaveAttribute(
      'href',
      '/es/appointments/new',
    )
  })

  it("shows the patient's notes, and marks the catalog as Spanish in English", async () => {
    server.use(
      http.get('*/appointments/:id', () =>
        HttpResponse.json({
          appointment: { ...testAppointment, status: 'confirmed', notes: 'Dolor abdominal' },
        }),
      ),
    )

    render(await details(testAppointment.id, 'en'))

    expect(terms()).toMatchObject({ Status: 'Confirmed', Time: '9:00 AM (Mexico City time)' })
    expect(screen.getByText('Dolor abdominal')).toBeInTheDocument()
    expect(screen.getByText('Ultrasonido')).toHaveAttribute('lang', 'es')
  })

  it("answers 404 to an appointment that is someone else's or does not exist", async () => {
    server.use(http.get('*/appointments/:id', () => HttpResponse.json({}, { status: 404 })))

    await expect(details('someone-else')).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    })
  })

  it('explains that the appointment could not be loaded when the API fails', async () => {
    server.use(http.get('*/appointments/:id', () => HttpResponse.error()))

    render(await details())

    expect(screen.getByText('No pudimos cargar tu cita')).toBeInTheDocument()
  })

  it('sends a visitor without a session to sign in, and back to the appointment', async () => {
    signedIn(false)

    await expect(details()).rejects.toMatchObject({
      digest: expect.stringContaining(
        `;/es/login?next=%2Fes%2Fappointments%2F${testAppointment.id};`,
      ),
    })
  })

  it('says that the appointment is loading, for screen readers too', () => {
    const { container } = render(<AppointmentDetailsFallback label="Cargando tu cita…" />)

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando tu cita…')).toBeInTheDocument()
  })
})
