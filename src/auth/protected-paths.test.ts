import { describe, expect, it } from 'vitest'
import { isProtectedPath } from './protected-paths'

describe('isProtectedPath', () => {
  it('protects each page in the list and the pages under it', () => {
    expect(isProtectedPath('/account')).toBe(true)
    expect(isProtectedPath('/account/settings')).toBe(true)
    expect(isProtectedPath('/profile')).toBe(true)
    expect(isProtectedPath('/appointments/new')).toBe(true)
  })

  it('leaves the other pages open', () => {
    expect(isProtectedPath('')).toBe(false)
    expect(isProtectedPath('/login')).toBe(false)
    expect(isProtectedPath('/accounting')).toBe(false)
  })
})
