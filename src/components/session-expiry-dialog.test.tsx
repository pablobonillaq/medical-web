import { server } from '@mocks/node'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/toast'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { useAppStore } from '@/store/hooks'
import {
  expiryWarned,
  selectExpiryStatus,
  sessionExpired,
  sessionStarted,
} from '@/store/session-expiry-slice'
import type { AppStore } from '@/store/store'
import { StoreProvider } from '@/store/store-provider'
import { SessionExpiryDialog } from './session-expiry-dialog'

// Outside Next.js there is no router: the current path is set by hand, and the test checks
// where the dialog sends the visitor
vi.mock('next/navigation', () => ({ usePathname: vi.fn(), useRouter: vi.fn() }))

const router = { replace: vi.fn(), refresh: vi.fn() }

beforeEach(() => {
  router.replace = vi.fn()
  router.refresh = vi.fn()
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
  vi.mocked(usePathname).mockReturnValue('/es/account')
})

// Keeps the store of the page, to move the session along as the saga would
const page: { store?: AppStore } = {}
function StoreProbe() {
  const store = useAppStore()
  useEffect(() => {
    page.store = store
  }, [store])
  return null
}

// An hour from now, like a new session: the saga that runs in the store must not warn on its own
const expiresAt = new Date(Date.now() + 60 * 60_000).toISOString()
const endsAt = (locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(expiresAt),
  )

const renderDialog = (labels = es.sessionExpiry, locale: 'es' | 'en' = 'es') => {
  render(
    <StoreProvider>
      <ToastProvider>
        <StoreProbe />
        <SessionExpiryDialog labels={labels} locale={locale} />
      </ToastProvider>
    </StoreProvider>,
  )
  act(() => {
    page.store!.dispatch(sessionStarted({ expiresAt }))
  })
}

const sagaDoes = (action: Parameters<AppStore['dispatch']>[0]) =>
  act(() => {
    page.store!.dispatch(action)
  })

describe('SessionExpiryDialog', () => {
  it('stays closed while the session has time left', () => {
    renderDialog()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('warns before the session ends, saying at what time', () => {
    renderDialog()

    sagaDoes(expiryWarned())

    const dialog = screen.getByRole('dialog', { name: 'Tu sesión está por terminar' })
    expect(dialog).toHaveAccessibleDescription(
      `Por seguridad, tu sesión se cierra a las ${endsAt('es')}. Guarda lo que estés escribiendo y vuelve a iniciar sesión para seguir.`,
    )
  })

  it('lets the visitor close the warning and keep working', async () => {
    const user = userEvent.setup()
    renderDialog()
    sagaDoes(expiryWarned())

    await user.click(screen.getByRole('button', { name: 'Seguir aquí' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(selectExpiryStatus(page.store!.getState())).toBe('dismissed')
  })

  it('signs out and goes to sign in again, coming back to the page', async () => {
    const user = userEvent.setup()
    server.use(http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })))
    renderDialog()
    sagaDoes(expiryWarned())

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión de nuevo' }))

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/es/login?next=%2Fes%2Faccount'),
    )
    expect(router.refresh).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('announces the end of the session and leaves a protected page for the sign-in page', () => {
    renderDialog()
    sagaDoes(expiryWarned())

    sagaDoes(sessionExpired())

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Tu sesión terminó. Inicia sesión de nuevo para continuar.',
    )
    expect(router.replace).toHaveBeenCalledWith('/es/login?next=%2Fes%2Faccount')
    expect(router.refresh).toHaveBeenCalled()
  })

  it('stays on a public page when the session ends, refreshed without it', () => {
    vi.mocked(usePathname).mockReturnValue('/en')
    renderDialog(en.sessionExpiry, 'en')

    sagaDoes(sessionExpired())

    expect(screen.getByRole('alert')).toHaveTextContent('Your session ended.')
    expect(router.replace).not.toHaveBeenCalled()
    expect(router.refresh).toHaveBeenCalled()
  })
})
