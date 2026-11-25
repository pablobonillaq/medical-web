import { server } from '@mocks/node'
import { testAccessLog } from '@mocks/patients'
import { fakeToken, testUsers } from '@mocks/session'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { ACCESS_LOG_PAGE_SIZE, AccessLog, AccessLogFallback } from './access-log'

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

const log = (query: Record<string, string> = {}, locale: 'es' | 'en' = 'es') => {
  const dictionary = locale === 'es' ? es : en
  return AccessLog({
    locale,
    labels: dictionary.accessLogPage,
    roles: dictionary.account.roles,
    searchParams: Promise.resolve(query),
  })
}

// The text of each cell of a row, or of each header
const texts = (cells: HTMLElement[]) => cells.map((cell) => cell.textContent)

describe('AccessLog', () => {
  it('lists who opened the record, when and what they did', async () => {
    render(await log())

    const table = screen.getByRole('table', { name: 'Accesos a tu expediente' })
    expect(table).toHaveAccessibleDescription('Horas de la Ciudad de México.')
    expect(texts(within(table).getAllByRole('columnheader'))).toEqual([
      'Fecha y hora',
      'Quién',
      'Qué hizo',
    ])
    const [, doctor, frontDesk] = within(table).getAllByRole('row')
    expect(texts(within(doctor).getAllByRole('cell'))).toEqual([
      '20 nov 2026, 10:05',
      'Ana Garay · Médico',
      'Consultó tu historial médico',
    ])
    expect(within(doctor).getByText('20 nov 2026, 10:05')).toHaveAttribute(
      'datetime',
      '2026-11-20T16:05:00.000Z',
    )
    // The API keeps the names of staff who are not doctors private: only the role
    expect(texts(within(frontDesk).getAllByRole('cell'))).toEqual([
      '19 nov 2026, 15:30',
      'Recepción',
      'Intentó abrir una nota clínica sin permiso',
    ])
    expect(screen.getByRole('link', { name: 'Volver a mi perfil' })).toHaveAttribute(
      'href',
      '/es/profile',
    )
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('asks the API for the page in the URL, and links to the others', async () => {
    let asked: URLSearchParams | undefined
    server.use(
      http.get('http://localhost:3000/patients/me/access-log', ({ request }) => {
        asked = new URL(request.url).searchParams
        return HttpResponse.json({ ...testAccessLog, page: 2, total: ACCESS_LOG_PAGE_SIZE * 3 })
      }),
    )

    render(await log({ page: '2' }))

    expect(Object.fromEntries(asked!)).toEqual({ page: '2', pageSize: '20' })
    const pages = screen.getByRole('navigation', { name: 'Páginas de los accesos' })
    expect(pages).toHaveTextContent('Página 2 de 3')
    expect(within(pages).getByRole('link', { name: 'Más recientes' })).toHaveAttribute(
      'href',
      '/es/profile/access-log',
    )
    expect(within(pages).getByRole('link', { name: 'Más antiguos' })).toHaveAttribute(
      'href',
      '/es/profile/access-log?page=3',
    )
  })

  it('says so when no one from the staff has opened the record', async () => {
    server.use(
      http.get('*/patients/me/access-log', () =>
        HttpResponse.json({ entries: [], page: 1, pageSize: 20, total: 0 }),
      ),
    )

    render(await log())

    expect(
      screen.getByText('Nadie del personal ha abierto tu expediente todavía.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a mi perfil' })).toBeInTheDocument()
  })

  it('writes it in English on the English pages', async () => {
    render(await log({}, 'en'))

    const [, doctor] = screen.getAllByRole('row')
    expect(texts(within(doctor).getAllByRole('cell'))).toEqual([
      'Nov 20, 2026, 10:05 AM',
      'Ana Garay · Doctor',
      'Viewed your medical history',
    ])
  })

  it('explains that the accesses could not be loaded when the API fails', async () => {
    server.use(http.get('*/patients/me/access-log', () => HttpResponse.error()))

    render(await log())

    expect(screen.getByText('No pudimos cargar los accesos')).toBeInTheDocument()
  })

  it('sends a visitor without a session to sign in, and back here', async () => {
    signedIn(false)

    await expect(log()).rejects.toMatchObject({
      digest: expect.stringContaining(';/es/login?next=%2Fes%2Fprofile%2Faccess-log;'),
    })
  })

  it('says that the accesses are loading, for screen readers too', () => {
    const { container } = render(<AccessLogFallback label="Cargando los accesos…" />)

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando los accesos…')).toBeInTheDocument()
  })
})
