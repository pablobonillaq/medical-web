import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { serverApiRequest } from './server'

// next/headers only works inside a Next.js request: in tests the cookies and headers of the
// request are set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))

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

// The API itself (API_URL, not /api)
const api = (answer: (request: Request) => Response) =>
  server.use(http.get('http://localhost:3000/things', ({ request }) => answer(request)))

describe('serverApiRequest', () => {
  it("asks the API with the visitor's session cookie and address", async () => {
    let seen: Request | undefined
    api((apiRequest) => {
      seen = apiRequest
      return HttpResponse.json({ things: [1, 2] })
    })
    request({ cookie: 'token', forwardedFor: '203.0.113.7' })

    await expect(serverApiRequest('/things')).resolves.toEqual({ things: [1, 2] })
    expect(seen?.headers.get('cookie')).toBe('access_token=token')
    expect(seen?.headers.get('x-forwarded-for')).toBe('203.0.113.7')
    expect(seen?.headers.get('accept')).toBe('application/json')
  })

  it('sends no cookie and no address when the visitor has none', async () => {
    let seen: Request | undefined
    api((apiRequest) => {
      seen = apiRequest
      return HttpResponse.json({})
    })
    request()

    await serverApiRequest('/things')

    expect(seen?.headers.has('cookie')).toBe(false)
    expect(seen?.headers.has('x-forwarded-for')).toBe(false)
  })

  it('turns an error answer into an ApiError with its status, message and details', async () => {
    api(() =>
      HttpResponse.json({ error: 'Invalid request data', details: { a: 1 } }, { status: 400 }),
    )
    request({ cookie: 'token' })

    const error = await serverApiRequest('/things').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, message: 'Invalid request data', details: { a: 1 } })
  })

  it('describes an error answer without a JSON body by its status', async () => {
    api(() => new HttpResponse('Bad gateway', { status: 502 }))
    request({ cookie: 'token' })

    await expect(serverApiRequest('/things')).rejects.toMatchObject({
      status: 502,
      message: 'Request failed with status 502',
    })
  })

  it('fails with status 0 when the API cannot be reached', async () => {
    api(() => HttpResponse.error())
    request({ cookie: 'token' })

    await expect(serverApiRequest('/things')).rejects.toMatchObject({ status: 0 })
  })
})
