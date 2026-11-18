import { fakeToken, testUsers } from '@mocks/session'
import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { describe, expect, it, vi } from 'vitest'
import { getSession } from './session'

// next/headers only works inside a Next.js request: in tests the cookies and headers of the
// request are set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))

const exp = Date.UTC(2026, 10, 18, 11, 0, 0) / 1000
const token = fakeToken({ sub: testUsers.patient.id, exp })

const request = ({ cookie, forwardedFor }: { cookie?: string; forwardedFor?: string } = {}) => {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === 'access_token' && cookie ? { name, value: cookie } : undefined,
  } as Awaited<ReturnType<typeof cookies>>)
  vi.mocked(headers).mockResolvedValue(
    new Headers(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}) as Awaited<
      ReturnType<typeof headers>
    >,
  )
}

// The API answers GET /auth/me (on API_URL, not through /api)
const me = (answer: (request: Request) => Response) =>
  server.use(http.get('http://localhost:3000/auth/me', ({ request }) => answer(request)))

describe('getSession', () => {
  it('is null without the session cookie, with no request to the API', async () => {
    request()

    await expect(getSession()).resolves.toBeNull()
  })

  it('is null when the cookie is not a token with an expiry', async () => {
    request({ cookie: 'garbage' })

    await expect(getSession()).resolves.toBeNull()
  })

  it('asks the API who the cookie belongs to and keeps only what the pages need', async () => {
    let seen: Request | undefined
    me((apiRequest) => {
      seen = apiRequest
      return HttpResponse.json({
        user: { ...testUsers.patient, active: true, createdAt: '2026-01-01T00:00:00.000Z' },
      })
    })
    request({ cookie: token })

    await expect(getSession()).resolves.toEqual({
      user: testUsers.patient,
      expiresAt: new Date(exp * 1000).toISOString(),
    })
    expect(seen?.headers.get('cookie')).toBe(`access_token=${token}`)
    expect(seen?.headers.has('x-forwarded-for')).toBe(false)
  })

  it("passes on the visitor's address, for the rate limits of the API", async () => {
    let forwardedFor: string | null = null
    me((apiRequest) => {
      forwardedFor = apiRequest.headers.get('x-forwarded-for')
      return HttpResponse.json({ user: testUsers.employee })
    })
    request({ cookie: token, forwardedFor: '203.0.113.7' })

    await getSession()

    expect(forwardedFor).toBe('203.0.113.7')
  })

  it('is null when the API rejects the token', async () => {
    me(() => HttpResponse.json({ error: 'Invalid or expired session' }, { status: 401 }))
    request({ cookie: token })

    await expect(getSession()).resolves.toBeNull()
  })

  it('is null when the API cannot be reached', async () => {
    me(() => HttpResponse.error())
    request({ cookie: token })

    await expect(getSession()).resolves.toBeNull()
  })
})
