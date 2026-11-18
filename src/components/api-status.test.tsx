import { server } from '@mocks/node'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { StoreProvider } from '@/store/store-provider'
import { ApiStatusIndicator } from './api-status'

const renderStatus = (labels = es.apiStatus) =>
  render(
    <StoreProvider>
      <ApiStatusIndicator labels={labels} />
    </StoreProvider>,
  )

describe('ApiStatusIndicator', () => {
  it('checks the API when the page loads and says it is available', async () => {
    renderStatus()

    expect(screen.getByText('Comprobando el servicio…')).toBeInTheDocument()
    expect(await screen.findByText('Servicio disponible')).toBeInTheDocument()
  })

  it('says the service is unavailable when the API does not answer', async () => {
    server.use(http.get('*/api/health', () => HttpResponse.error()))
    renderStatus()

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
  })

  it('speaks the language of the page', async () => {
    renderStatus(en.apiStatus)

    expect(await screen.findByText('Service available')).toBeInTheDocument()
  })
})
