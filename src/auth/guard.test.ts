import { server } from '@mocks/node'
import { fakeToken, testUsers } from '@mocks/session'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { lang } from 'next/root-params'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSession } from './guard'

// Outside a Next.js request: the cookies, headers and language of the URL are set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

const token = fakeToken({ sub: testUsers.patient.id, exp: Date.now() / 1000 + 3600 })

const request = (cookie?: string) => {
  vi.mocked(cookies).mockResolvedValue({
    get: () => (cookie ? { name: 'access_token', value: cookie } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>)
  vi.mocked(headers).mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>)
}

const signedInAs = (user: (typeof testUsers)[keyof typeof testUsers]) => {
  server.use(http.get('http://localhost:3000/auth/me', () => HttpResponse.json({ user })))
  request(token)
}

beforeEach(() => {
  vi.mocked(lang).mockResolvedValue('es')
  // forbidden() only works with experimental.authInterrupts, which sets this variable
  process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS = 'true'
})

afterEach(() => {
  delete process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS
})

describe('requireSession', () => {
  it('gives back the session of who is signed in', async () => {
    signedInAs(testUsers.patient)

    await expect(requireSession({ path: '/account' })).resolves.toMatchObject({
      user: testUsers.patient,
    })
  })

  it('sends a visitor without a session to sign in, coming back to the page', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    request()

    await expect(requireSession({ path: '/account' })).rejects.toMatchObject({
      digest: expect.stringContaining(';/en/login?next=%2Fen%2Faccount;'),
    })
  })

  it('lets in the roles the page allows', async () => {
    signedInAs(testUsers.employee)

    await expect(
      requireSession({ path: '/patients', roles: ['employee', 'admin'] }),
    ).resolves.toMatchObject({ user: testUsers.employee })
  })

  it('answers 403 to any other role', async () => {
    signedInAs(testUsers.patient)

    await expect(
      requireSession({ path: '/patients', roles: ['employee', 'admin'] }),
    ).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;403' })
  })
})
