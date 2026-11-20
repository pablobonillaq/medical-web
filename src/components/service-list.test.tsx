import { server } from '@mocks/node'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { ServiceList, ServiceListFallback } from './service-list'

// The cache only exists inside Next.js
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

describe('ServiceList', () => {
  it('shows each service as a card with its name, description and duration', async () => {
    render(await ServiceList({ locale: 'es', labels: es.servicesPage }))

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(
      within(items[0]).getByRole('heading', { level: 2, name: 'Consulta general' }),
    ).toBeInTheDocument()
    expect(items[0]).toHaveTextContent('Valoración médica de primera vez o de seguimiento.')
    expect(items[0]).toHaveTextContent('Duración: 30 minutos')
    expect(items[1]).toHaveTextContent('Duración: 45 minutos')
  })

  it('marks the catalog as Spanish on pages in other languages', async () => {
    render(await ServiceList({ locale: 'en', labels: en.servicesPage }))

    const name = screen.getByRole('heading', { name: 'Consulta general' })
    expect(name).toHaveAttribute('lang', 'es')
    expect(screen.getByText('Valoración médica de primera vez o de seguimiento.')).toHaveAttribute(
      'lang',
      'es',
    )
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Duration: 30 minutes')
  })

  it('does not repeat the language of the page', async () => {
    render(await ServiceList({ locale: 'es', labels: es.servicesPage }))

    expect(screen.getByRole('heading', { name: 'Consulta general' })).not.toHaveAttribute('lang')
  })

  it('says so when there are no services', async () => {
    server.use(http.get('*/services', () => HttpResponse.json({ services: [] })))

    render(await ServiceList({ locale: 'es', labels: es.servicesPage }))

    expect(screen.getByText('Por ahora no hay servicios disponibles.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('explains that the services could not be loaded when the API is down', async () => {
    server.use(http.get('*/services', () => HttpResponse.error()))

    render(await ServiceList({ locale: 'es', labels: es.servicesPage }))

    expect(screen.getByText('No pudimos cargar los servicios')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('ServiceListFallback', () => {
  it('tells screen readers that the services are loading', () => {
    const { container } = render(<ServiceListFallback label="Cargando servicios…" />)

    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando servicios…')).toBeInTheDocument()
  })
})
