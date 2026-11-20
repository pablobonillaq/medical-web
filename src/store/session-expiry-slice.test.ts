import { describe, expect, it } from 'vitest'
import {
  expiryWarned,
  selectExpiresAt,
  selectExpiryStatus,
  sessionEnded,
  sessionExpired,
  sessionStarted,
  warningDismissed,
} from './session-expiry-slice'
import { signOut } from './session-slice'
import { makeStore } from './store'

const expiresAt = '2026-11-19T18:00:00.000Z'

describe('sessionExpiry', () => {
  it('follows a session from its start to its end', () => {
    const store = makeStore()
    const status = () => selectExpiryStatus(store.getState())

    store.dispatch(sessionStarted({ expiresAt }))
    expect(selectExpiresAt(store.getState())).toBe(expiresAt)
    expect(status()).toBe('none')

    store.dispatch(expiryWarned())
    expect(status()).toBe('warning')

    store.dispatch(warningDismissed())
    expect(status()).toBe('dismissed')

    store.dispatch(sessionExpired())
    expect(status()).toBe('expired')
  })

  it('forgets the session when it ends or the visitor signs out', () => {
    const store = makeStore()

    store.dispatch(sessionStarted({ expiresAt }))
    store.dispatch(sessionEnded())
    expect(store.getState().sessionExpiry).toEqual({ expiresAt: null, status: 'none' })

    store.dispatch(sessionStarted({ expiresAt }))
    store.dispatch(expiryWarned())
    store.dispatch(signOut.fulfilled(undefined, 'request-id'))
    expect(store.getState().sessionExpiry).toEqual({ expiresAt: null, status: 'none' })
  })

  it('keeps the end of the session when the dialog closes because of it', () => {
    const store = makeStore()

    store.dispatch(sessionStarted({ expiresAt }))
    store.dispatch(sessionExpired())
    store.dispatch(warningDismissed())

    expect(selectExpiryStatus(store.getState())).toBe('expired')
  })
})
