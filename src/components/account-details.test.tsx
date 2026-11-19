import { server } from '@mocks/node'
import { fakeToken, testUsers } from '@mocks/session'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { describe, expect, it, vi } from 'vitest'
import { es } from '@/i18n/dictionaries/es'
import { AccountDetails, AccountDetailsFallback } from './account-details'

// Outside a Next.js request: the cookies, headers and language of the URL are set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

const request = (cookie?: string) => {
  vi.mocked(cookies).mockResolvedValue({
    get: () => (cookie ? { name: 'access_token', value: cookie } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>)
  vi.mocked(headers).mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>)
}

const details = () => AccountDetails({ labels: es.accountPage, roles: es.account.roles })

describe('AccountDetails', () => {
  it('shows the email and role of who is signed in', async () => {
    server.use(
      http.get('http://localhost:3000/auth/me', () =>
        HttpResponse.json({ user: testUsers.employee }),
      ),
    )
    request(fakeToken({ sub: testUsers.employee.id, exp: Date.now() / 1000 + 3600 }))

    render(await details())

    expect(screen.getByText('recepcion@clinica.test').tagName).toBe('DD')
    expect(screen.getByText('Recepción')).toBeInTheDocument()
  })

  it('sends a visitor without a session to sign in', async () => {
    request()

    await expect(details()).rejects.toMatchObject({
      digest: expect.stringContaining(';/es/login?next=%2Fes%2Faccount;'),
    })
  })

  it('says that the details are loading, for screen readers too', () => {
    const { container } = render(<AccountDetailsFallback label="Cargando tu cuenta…" />)

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando tu cuenta…')).toBeInTheDocument()
  })
})
