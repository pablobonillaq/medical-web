import { server } from '@mocks/node'
import { testPatientPage } from '@mocks/patients'
import { fakeToken, testUsers } from '@mocks/session'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { PATIENTS_PAGE_SIZE, PatientSearch, PatientSearchFallback } from './patient-search'

// Outside a Next.js request: the session, the language and <Form> are set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/form', () => ({ default: (props: object) => <form {...props} /> }))

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
  signedIn(testUsers.employee)
})

// The queries the API was asked
const asked = () => {
  const queries: URLSearchParams[] = []
  server.use(
    http.get('http://localhost:3000/patients', ({ request }) => {
      queries.push(new URL(request.url).searchParams)
      return HttpResponse.json(testPatientPage)
    }),
  )
  return queries
}

const patients = (query: Record<string, string> = {}, locale: 'es' | 'en' = 'es') =>
  PatientSearch({
    locale,
    labels: locale === 'es' ? es.patientsPage : en.patientsPage,
    searchParams: Promise.resolve(query),
  })

// The text of each cell of a row, its header included
const texts = (row: HTMLElement) =>
  [...within(row).getAllByRole('rowheader'), ...within(row).getAllByRole('cell')].map(
    (cell) => cell.textContent,
  )

describe('PatientSearch', () => {
  it('lists every patient by last name when there is no search', async () => {
    const queries = asked()

    render(await patients())

    expect(Object.fromEntries(queries[0])).toEqual({ page: '1', pageSize: '20' })
    expect(screen.getByRole('status')).toHaveTextContent('2 pacientes')
    const table = screen.getByRole('table', { name: 'Todos los pacientes' })
    const [, withAccount, walkIn] = within(table).getAllByRole('row')
    expect(texts(withAccount)).toEqual(['Méndez, Luz', '21 may 1990', '+525512345678', 'Sí'])
    expect(texts(walkIn)).toEqual(['Ortega Salas, Ramón', '14 mar 1958', '+525587654321', 'No'])
    expect(within(walkIn).getByRole('link', { name: 'Ortega Salas, Ramón' })).toHaveAttribute(
      'href',
      `/es/front-desk/patients/${testPatientPage.patients[1].id}`,
    )
  })

  it('searches what is in the URL, and keeps it in the form', async () => {
    const queries = asked()

    render(await patients({ search: '  ortega  ' }))

    expect(queries[0].get('search')).toBe('ortega')
    expect(screen.getByRole('searchbox', { name: 'Buscar paciente' })).toHaveValue('ortega')
    expect(screen.getByRole('search')).toHaveAttribute('action', '/es/front-desk/patients')
    expect(
      screen.getByRole('table', { name: 'Pacientes que coinciden con “ortega”' }),
    ).toBeInTheDocument()
  })

  it('counts a single patient in the singular', async () => {
    server.use(
      http.get('*/patients', () =>
        HttpResponse.json({
          ...testPatientPage,
          patients: testPatientPage.patients.slice(1),
          total: 1,
        }),
      ),
    )

    render(await patients({ search: 'ortega' }))

    expect(screen.getByRole('status')).toHaveTextContent('1 paciente')
    expect(screen.getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual([
      'Ortega Salas, Ramón',
    ])
  })

  it('says so when no patient matches', async () => {
    server.use(
      http.get('*/patients', () =>
        HttpResponse.json({ patients: [], page: 1, pageSize: 20, total: 0 }),
      ),
    )

    render(await patients({ search: 'zz' }))

    expect(screen.getByRole('status')).toHaveTextContent('0 pacientes')
    expect(screen.getByText(/No encontramos pacientes con “zz”/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('says so when there are no patients yet', async () => {
    server.use(
      http.get('*/patients', () =>
        HttpResponse.json({ patients: [], page: 1, pageSize: 20, total: 0 }),
      ),
    )

    render(await patients())

    expect(screen.getByText('Todavía no hay pacientes registrados.')).toBeInTheDocument()
  })

  it('asks for at least 2 characters, without searching', async () => {
    const queries = asked()

    render(await patients({ search: 'o' }))

    expect(screen.getByRole('searchbox')).toHaveAccessibleDescription(
      /Escribe al menos 2 caracteres/,
    )
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true')
    expect(queries).toHaveLength(0)
  })

  it('pages through the results, keeping the search', async () => {
    const queries = asked()
    server.use(
      http.get('http://localhost:3000/patients', ({ request }) => {
        queries.push(new URL(request.url).searchParams)
        return HttpResponse.json({ ...testPatientPage, page: 2, total: PATIENTS_PAGE_SIZE * 3 })
      }),
    )

    render(await patients({ search: 'luz', page: '2' }))

    expect(queries[0].get('page')).toBe('2')
    const pages = screen.getByRole('navigation', { name: 'Páginas de pacientes' })
    expect(within(pages).getByRole('link', { name: 'Siguientes' })).toHaveAttribute(
      'href',
      '/es/front-desk/patients?search=luz&page=3',
    )
  })

  it('writes it in English on the English pages', async () => {
    render(await patients({}, 'en'))

    expect(screen.getByRole('status')).toHaveTextContent('2 patients')
    const [, withAccount] = screen.getAllByRole('row')
    expect(texts(withAccount)).toEqual(['Méndez, Luz', 'May 21, 1990', '+525512345678', 'Yes'])
  })

  it('keeps the search when the patients could not be loaded', async () => {
    server.use(http.get('*/patients', () => HttpResponse.error()))

    render(await patients({ search: 'luz' }))

    expect(screen.getByText('No pudimos cargar los pacientes')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toHaveValue('luz')
  })

  it('answers 403 to anyone who is not from the front desk', async () => {
    signedIn(testUsers.patient)
    // forbidden() only works with experimental.authInterrupts, which sets this variable
    process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS = 'true'

    try {
      await expect(patients()).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;403' })
    } finally {
      delete process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS
    }
  })

  it('sends a visitor without a session to sign in, and back here', async () => {
    signedIn(null)

    await expect(patients()).rejects.toMatchObject({
      digest: expect.stringContaining(';/es/login?next=%2Fes%2Ffront-desk%2Fpatients;'),
    })
  })

  it('says that the patients are loading, for screen readers too', () => {
    const { container } = render(<PatientSearchFallback label="Cargando los pacientes…" />)

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando los pacientes…')).toBeInTheDocument()
  })
})
