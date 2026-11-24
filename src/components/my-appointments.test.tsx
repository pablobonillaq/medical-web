import { testAppointment } from '@mocks/appointments'
import { server } from '@mocks/node'
import { fakeToken, testUsers } from '@mocks/session'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Appointment } from '@/appointments/types'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { MyAppointments, MyAppointmentsFallback, PAST_PAGE_SIZE } from './my-appointments'

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

const past: Appointment = {
  ...testAppointment,
  id: '0190a7b2-4444-7000-8000-000000000002',
  status: 'completed',
  startsAt: '2026-10-05T16:30:00.000Z',
}

// The API answers the upcoming ones (from=) and the past ones (to=) apart
const answer = (
  upcoming: Appointment[],
  pastAppointments: Appointment[],
  total = pastAppointments.length,
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
        : HttpResponse.json({
            appointments: pastAppointments,
            page: Number(query.get('page')),
            pageSize: PAST_PAGE_SIZE,
            total,
          })
    }),
  )
  return asked
}

beforeEach(() => {
  signedIn()
  server.use(
    http.get('http://localhost:3000/auth/me', () => HttpResponse.json({ user: testUsers.patient })),
  )
})

const list = (query: Record<string, string> = {}, locale: 'es' | 'en' = 'es') =>
  MyAppointments({
    locale,
    labels: locale === 'es' ? es.appointmentsPage : en.appointmentsPage,
    statuses: (locale === 'es' ? es : en).appointmentPage.statuses,
    searchParams: Promise.resolve(query),
  })

const section = (name: string) => screen.getByRole('region', { name })

describe('MyAppointments', () => {
  it('lists the upcoming and the past appointments, each linking to it', async () => {
    answer([testAppointment], [past])

    render(await list())

    const upcoming = within(section('Próximas')).getByRole('listitem')
    expect(
      within(upcoming).getByRole('link', { name: 'jueves, 26 de noviembre de 2026, 9:00' }),
    ).toHaveAttribute('href', `/es/appointments/${testAppointment.id}`)
    expect(upcoming).toHaveTextContent('Ultrasonido · Luis Ruiz')
    expect(upcoming).toHaveTextContent('Agendada')
    expect(within(section('Anteriores')).getByRole('listitem')).toHaveTextContent('Atendida')
    expect(screen.getByRole('link', { name: 'Agendar cita' })).toHaveAttribute(
      'href',
      '/es/appointments/new',
    )
  })

  it('says so when there are none', async () => {
    answer([], [])

    render(await list())

    expect(within(section('Próximas')).getByText('No tienes citas próximas.')).toBeInTheDocument()
    expect(
      within(section('Anteriores')).getByText('Todavía no tienes citas anteriores.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('asks the API for the page of the history in the URL, and links to the next ones', async () => {
    const asked = answer([], [past], PAST_PAGE_SIZE * 3)

    render(await list({ page: '2' }))

    expect(asked.find((query) => query.has('to'))?.get('page')).toBe('2')
    const pages = screen.getByRole('navigation', { name: 'Páginas de tus citas anteriores' })
    expect(pages).toHaveTextContent('Página 2 de 3')
    expect(within(pages).getByRole('link', { name: 'Más recientes' })).toHaveAttribute(
      'href',
      '/es/appointments',
    )
    expect(within(pages).getByRole('link', { name: 'Más antiguas' })).toHaveAttribute(
      'href',
      '/es/appointments?page=3',
    )
  })

  it('has no link past the first or the last page', async () => {
    answer([], [past], PAST_PAGE_SIZE * 2)

    render(await list({ page: 'nada' }))

    const pages = screen.getByRole('navigation')
    expect(pages).toHaveTextContent('Página 1 de 2')
    expect(within(pages).queryByRole('link', { name: 'Más recientes' })).not.toBeInTheDocument()
    expect(within(pages).getByRole('link', { name: 'Más antiguas' })).toBeInTheDocument()
  })

  it('writes dates as each language does and marks the catalog as Spanish', async () => {
    answer([testAppointment], [])

    render(await list({}, 'en'))

    expect(
      screen.getByRole('link', { name: 'Thursday, November 26, 2026, 9:00 AM' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ultrasonido')).toHaveAttribute('lang', 'es')
  })

  it('explains that the appointments could not be loaded when the API fails', async () => {
    server.use(http.get('*/appointments', () => HttpResponse.error()))

    render(await list())

    expect(screen.getByText('No pudimos cargar tus citas')).toBeInTheDocument()
  })

  it('sends a visitor without a session to sign in', async () => {
    signedIn(false)

    await expect(list()).rejects.toMatchObject({
      digest: expect.stringContaining(';/es/login?next=%2Fes%2Fappointments;'),
    })
  })

  it('says that the appointments are loading, for screen readers too', () => {
    const { container } = render(<MyAppointmentsFallback label="Cargando tus citas…" />)

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando tus citas…')).toBeInTheDocument()
  })
})
