import { server } from '@mocks/node'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from '@/components/ui/toast'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { statusChecked } from '@/store/api-status-slice'
import { useAppStore } from '@/store/hooks'
import type { AppStore } from '@/store/store'
import { StoreProvider } from '@/store/store-provider'
import { ApiStatusIndicator } from './api-status'

// Keeps the store of the page, to change the status as the saga would
const page: { store?: AppStore } = {}
function StoreProbe() {
  const store = useAppStore()
  useEffect(() => {
    page.store = store
  }, [store])
  return null
}

const renderStatus = (labels = es.apiStatus) =>
  render(
    <StoreProvider>
      <ToastProvider>
        <StoreProbe />
        <ApiStatusIndicator labels={labels} />
      </ToastProvider>
    </StoreProvider>,
  )

const apiDown = () => server.use(http.get('*/api/health', () => HttpResponse.error()))

describe('ApiStatusIndicator', () => {
  it('checks the API when the page loads and says it is available', async () => {
    renderStatus()

    expect(screen.getByText('Comprobando el servicio…')).toBeInTheDocument()
    expect(await screen.findByText('Servicio disponible')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('says the service is unavailable when the API does not answer', async () => {
    apiDown()
    renderStatus()

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
    // The status found when the page loads is not announced: the footer already says it
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('checks again when the visitor asks, and announces that the connection is back', async () => {
    const user = userEvent.setup()
    apiDown()
    renderStatus()
    const retry = await screen.findByRole('button', { name: 'Reintentar' })
    // The API answers again
    server.resetHandlers()

    await user.click(retry)

    expect(await screen.findByText('Servicio disponible')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('La conexión con el servicio volvió')
  })

  it('announces at once when the connection is lost', async () => {
    renderStatus()
    await screen.findByText('Servicio disponible')

    act(() => {
      page.store?.dispatch(statusChecked('offline'))
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Se perdió la conexión con el servicio')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('speaks the language of the page', async () => {
    renderStatus(en.apiStatus)

    expect(await screen.findByText('Service available')).toBeInTheDocument()
  })
})
