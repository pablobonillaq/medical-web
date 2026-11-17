import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import { ApiError, apiRequest } from './client'

// Catches the ApiError a request throws, to check its fields
const failure = (request: Promise<unknown>) =>
  request.then(
    () => {
      throw new Error('The request should have failed')
    },
    (error: unknown) => error as ApiError,
  )

describe('apiRequest', () => {
  it('reads JSON from /api on the same origin', async () => {
    let seen: Request | undefined
    server.use(
      http.get('*/api/services', ({ request }) => {
        seen = request
        return HttpResponse.json([{ id: 1, name: 'Consulta general' }])
      }),
    )

    await expect(apiRequest('/services')).resolves.toEqual([{ id: 1, name: 'Consulta general' }])
    expect(new URL(seen!.url).origin).toBe(window.location.origin)
    expect(seen!.headers.get('accept')).toBe('application/json')
  })

  it('sends the body as JSON and keeps the headers it gets', async () => {
    let seen: { body: unknown; contentType: string | null; custom: string | null } | undefined
    server.use(
      http.post('*/api/auth/login', async ({ request }) => {
        seen = {
          body: await request.json(),
          contentType: request.headers.get('content-type'),
          custom: request.headers.get('x-request-id'),
        }
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'paciente@test.com' },
      headers: { 'X-Request-Id': 'abc' },
    })

    expect(seen).toEqual({
      body: { email: 'paciente@test.com' },
      contentType: 'application/json',
      custom: 'abc',
    })
  })

  it('gives back undefined for an answer without a body', async () => {
    server.use(http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })))

    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined()
  })

  it('turns an error of the API into an ApiError with its status and details', async () => {
    const details = { fieldErrors: { email: ['Invalid email'] } }
    server.use(
      http.post('*/api/auth/register', () =>
        HttpResponse.json({ error: 'Invalid request data', details }, { status: 400 }),
      ),
    )

    const error = await failure(apiRequest('/auth/register', { method: 'POST', body: {} }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Invalid request data',
      details,
    })
  })

  it('describes an error that has no JSON body by its status', async () => {
    server.use(http.get('*/api/health', () => new HttpResponse('Bad gateway', { status: 502 })))

    const error = await failure(apiRequest('/health'))

    expect(error).toMatchObject({ status: 502, message: 'Request failed with status 502' })
    expect(error.details).toBeUndefined()
  })

  it('answers status 0 when the API cannot be reached', async () => {
    server.use(http.get('*/api/health', () => HttpResponse.error()))

    const error = await failure(apiRequest('/health'))

    expect(error).toMatchObject({ status: 0, message: 'The API could not be reached' })
  })
})
