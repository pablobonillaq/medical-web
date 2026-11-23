import { testServices } from '@mocks/catalog'
import { server } from '@mocks/node'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { DoctorDirectory, DoctorDirectoryFallback } from './doctor-directory'

// Outside Next.js there is no cache, and <Form> needs the router: a plain form does the same job
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('next/form', () => ({ default: (props: object) => <form {...props} /> }))

const renderDirectory = async (
  query: Record<string, string | string[] | undefined> = {},
  locale: 'es' | 'en' = 'es',
) => {
  const labels = locale === 'es' ? es.doctorsPage : en.doctorsPage
  render(await DoctorDirectory({ locale, labels, searchParams: Promise.resolve(query) }))
}

describe('DoctorDirectory', () => {
  it('shows each doctor with specialty, license number and services', async () => {
    await renderDirectory()

    expect(screen.getByRole('status')).toHaveTextContent('2 médicos')
    const card = screen.getByRole('heading', { level: 2, name: 'Luis Ruiz' }).closest('li')!
    expect(card).toHaveTextContent('Radiología')
    expect(card).toHaveTextContent('Cédula profesional: 7654321')
    const services = within(card).getByRole('list', { name: 'Servicios' })
    expect(
      within(services)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Consulta general', 'Ultrasonido'])
  })

  it('filters by service, with the choice kept in the form', async () => {
    await renderDirectory({ service: testServices[1].id })

    expect(screen.getByRole('status')).toHaveTextContent('1 médico')
    expect(screen.getByRole('heading', { level: 2, name: 'Luis Ruiz' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ana Garay' })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Servicio' })).toHaveValue(testServices[1].id)
  })

  it('sends the filter in the URL of the page, so it can be shared', async () => {
    await renderDirectory()

    const select = screen.getByRole('combobox', { name: 'Servicio' })
    const form = select.closest('form')!
    expect(form).toHaveAttribute('action', '/es/doctors')
    expect(select).toHaveAttribute('name', 'service')
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Todos los servicios', 'Consulta general', 'Ultrasonido'])
    expect(screen.getByRole('button', { name: 'Filtrar' })).toHaveAttribute('type', 'submit')
  })

  it.each([
    ['all services', { service: '' }],
    ['repeated values', { service: ['a', 'b'] }],
  ])('shows every doctor for %s', async (_case, query) => {
    await renderDirectory(query)

    expect(screen.getByRole('status')).toHaveTextContent('2 médicos')
    expect(screen.getByRole('combobox', { name: 'Servicio' })).toHaveValue('')
  })

  it('says so when no doctor offers the service', async () => {
    await renderDirectory({ service: 'sin-medicos' })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Ningún médico ofrece este servicio por ahora.',
    )
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('marks the catalog as Spanish on pages in other languages', async () => {
    await renderDirectory({}, 'en')

    expect(screen.getByRole('status')).toHaveTextContent('2 doctors')
    expect(screen.getByText('Radiología')).toHaveAttribute('lang', 'es')
    expect(screen.getByRole('option', { name: 'Ultrasonido' })).toHaveAttribute('lang', 'es')
    expect(screen.getByRole('heading', { name: 'Luis Ruiz' })).not.toHaveAttribute('lang')
  })

  it('leaves the filter out when the services cannot be loaded', async () => {
    server.use(http.get('*/services', () => HttpResponse.error()))

    await renderDirectory()

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 médicos')
  })

  it('says so when there are no doctors', async () => {
    server.use(http.get('*/doctors', () => HttpResponse.json({ doctors: [] })))

    await renderDirectory()

    expect(screen.getByText('Por ahora no hay médicos disponibles.')).toBeInTheDocument()
  })

  it('explains that the doctors could not be loaded when the API is down', async () => {
    server.use(http.get('*/doctors', () => HttpResponse.error()))

    await renderDirectory()

    expect(screen.getByText('No pudimos cargar los médicos')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('DoctorDirectoryFallback', () => {
  it('tells screen readers that the doctors are loading', () => {
    const { container } = render(<DoctorDirectoryFallback label="Cargando médicos…" />)

    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando médicos…')).toBeInTheDocument()
  })
})
