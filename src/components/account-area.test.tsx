import { server } from '@mocks/node'
import { fakeToken, testUsers } from '@mocks/session'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/toast'
import { es } from '@/i18n/dictionaries/es'
import { StoreProvider } from '@/store/store-provider'
import { AccountArea, AccountAreaFallback } from './account-area'

// next/headers only works inside a Next.js request; outside Next.js there is no router
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: () => '/es', useRouter: vi.fn() }))

// A request with or without the session cookie. The real getSession asks the fake API
const request = (cookie?: string) => {
  vi.mocked(cookies).mockResolvedValue({
    get: () => (cookie ? { name: 'access_token', value: cookie } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>)
  vi.mocked(headers).mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>)
}

const renderArea = async () =>
  render(
    <StoreProvider>
      <ToastProvider>{await AccountArea({ locale: 'es', labels: es.account })}</ToastProvider>
    </StoreProvider>,
  )

describe('AccountArea', () => {
  it('links to the sign-in page without a session', async () => {
    request()
    await renderArea()

    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('shows who is signed in, as the API says', async () => {
    server.use(
      http.get('http://localhost:3000/auth/me', () =>
        HttpResponse.json({ user: testUsers.patient }),
      ),
    )
    request(fakeToken({ sub: testUsers.patient.id, exp: Date.now() / 1000 + 3600 }))
    await renderArea()

    expect(screen.getByText('paciente@test.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })

  it('holds its place with a block hidden from screen readers while the session is read', () => {
    const html = renderToStaticMarkup(<AccountAreaFallback />)

    expect(html).toContain('aria-hidden="true"')
  })
})
