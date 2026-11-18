import { server } from '@mocks/node'
import { testUsers } from '@mocks/session'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import {
  selectSessionUser,
  selectSignInError,
  selectSigningIn,
  signIn,
  signInErrorFor,
  selectSigningOut,
  signOut,
} from './session-slice'
import { makeStore } from './store'

const credentials = { email: testUsers.patient.email, password: '12345678' }

const login = (answer: (request: Request) => Response | Promise<Response>) =>
  server.use(http.post('*/api/auth/login', ({ request }) => answer(request)))

describe('signInErrorFor', () => {
  it('explains each answer of the API', () => {
    expect(signInErrorFor(new ApiError(401, 'Invalid email or password'))).toBe(
      'invalidCredentials',
    )
    expect(signInErrorFor(new ApiError(403, 'Account is disabled'))).toBe('disabled')
    expect(signInErrorFor(new ApiError(429, 'Too many failed sign-in attempts'))).toBe(
      'tooManyAttempts',
    )
    expect(signInErrorFor(new ApiError(0, 'The API could not be reached'))).toBe('network')
  })

  it('gives unknown for anything else', () => {
    expect(signInErrorFor(new ApiError(500, 'Internal server error'))).toBe('unknown')
    expect(signInErrorFor(new Error('boom'))).toBe('unknown')
  })
})

describe('signIn', () => {
  it('sends the credentials and keeps only what the pages need of the user', async () => {
    let sent: unknown
    login(async (request) => {
      sent = await request.json()
      return HttpResponse.json({
        user: { ...testUsers.patient, active: true, createdAt: '2026-01-01T00:00:00.000Z' },
      })
    })
    const store = makeStore()

    const signingIn = store.dispatch(signIn(credentials))
    expect(selectSigningIn(store.getState())).toBe(true)
    await signingIn

    expect(sent).toEqual(credentials)
    expect(selectSigningIn(store.getState())).toBe(false)
    expect(selectSessionUser(store.getState())).toEqual(testUsers.patient)
    expect(selectSignInError(store.getState())).toBeNull()
  })

  it('records why it failed, and clears it on the next try', async () => {
    login(() => HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
    const store = makeStore()

    await store.dispatch(signIn(credentials))
    expect(selectSignInError(store.getState())).toBe('invalidCredentials')
    expect(selectSessionUser(store.getState())).toBeNull()

    const retry = store.dispatch(signIn(credentials))
    expect(selectSignInError(store.getState())).toBeNull()
    await retry
  })

  it('counts a sign-in that ended without an answer as unknown', () => {
    const store = makeStore()

    store.dispatch(signIn.rejected(new Error('Aborted'), 'request-id', credentials))

    expect(selectSignInError(store.getState())).toBe('unknown')
  })
})

describe('signOut', () => {
  const signedIn = () =>
    makeStore({
      session: { user: testUsers.patient, signingIn: false, signInError: null, signingOut: false },
    })

  it('asks the API to clear the session and forgets the user', async () => {
    let requests = 0
    server.use(
      http.post('*/api/auth/logout', () => {
        requests += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const store = signedIn()

    const signingOut = store.dispatch(signOut())
    expect(selectSigningOut(store.getState())).toBe(true)
    await signingOut

    expect(requests).toBe(1)
    expect(selectSigningOut(store.getState())).toBe(false)
    expect(selectSessionUser(store.getState())).toBeNull()
  })

  it('keeps the user when the API could not clear the session', async () => {
    server.use(http.post('*/api/auth/logout', () => HttpResponse.error()))
    const store = signedIn()

    await store.dispatch(signOut())

    expect(selectSigningOut(store.getState())).toBe(false)
    expect(selectSessionUser(store.getState())).toEqual(testUsers.patient)
  })
})
