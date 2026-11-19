import { server } from '@mocks/node'
import { testUsers } from '@mocks/session'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/toast'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { StoreProvider } from '@/store/store-provider'
import { AccountMenu } from './account-menu'

// Outside Next.js there is no router: the test checks where the menu sends the visitor
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))

const router = { replace: vi.fn(), refresh: vi.fn() }

beforeEach(() => {
  router.replace = vi.fn()
  router.refresh = vi.fn()
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
})

const renderMenu = (labels = es.account, locale: 'es' | 'en' = 'es') =>
  render(
    <StoreProvider>
      <ToastProvider>
        <AccountMenu user={testUsers.employee} locale={locale} labels={labels} />
      </ToastProvider>
    </StoreProvider>,
  )

describe('AccountMenu', () => {
  it('says who is signed in and with which role', () => {
    renderMenu()

    expect(screen.getByText(/Sesión iniciada como/).parentElement).toHaveTextContent(
      'Sesión iniciada como recepcion@clinica.test · Recepción',
    )
  })

  it('links to the account page in the language of the page', () => {
    renderMenu()

    expect(screen.getByRole('link', { name: 'Mi cuenta' })).toHaveAttribute('href', '/es/account')
  })

  it('signs out and goes to the home page', async () => {
    const user = userEvent.setup()
    server.use(http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })))
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/es'))
    expect(router.refresh).toHaveBeenCalled()
  })

  it('announces that the session could not be closed and stays on the page', async () => {
    const user = userEvent.setup()
    server.use(http.post('*/api/auth/logout', () => HttpResponse.error()))
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByText(/No pudimos cerrar tu sesión/)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cerrar tu sesión')
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('speaks the language of the page', () => {
    renderMenu(en.account, 'en')

    expect(screen.getByText(/Front desk/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })
})
