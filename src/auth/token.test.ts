import { fakeToken } from '@mocks/session'
import { describe, expect, it } from 'vitest'
import { readTokenExpiry } from './token'

describe('readTokenExpiry', () => {
  it('reads when the token expires', () => {
    const exp = Date.UTC(2026, 10, 18, 11, 0, 0) / 1000

    expect(readTokenExpiry(fakeToken({ sub: 'user', exp }))).toEqual(new Date(exp * 1000))
  })

  it('gives null for a token without an expiry', () => {
    expect(readTokenExpiry(fakeToken({ sub: 'user' }))).toBeNull()
    expect(readTokenExpiry(fakeToken({ sub: 'user', exp: 'tomorrow' }))).toBeNull()
  })

  it('gives null for something that is not a token', () => {
    expect(readTokenExpiry('not-a-token')).toBeNull()
    expect(readTokenExpiry('header.%%%.signature')).toBeNull()
  })
})
