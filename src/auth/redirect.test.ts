import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from './redirect'

describe('safeRedirectPath', () => {
  it('goes back to the page of this site the visitor came from', () => {
    expect(safeRedirectPath('/es/appointments?day=monday', 'es')).toBe(
      '/es/appointments?day=monday',
    )
  })

  it('goes to the home page in the language of the form without a page to go back to', () => {
    expect(safeRedirectPath(null, 'en')).toBe('/en')
    expect(safeRedirectPath('', 'es')).toBe('/es')
  })

  it('never leaves the site', () => {
    for (const next of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
    ]) {
      expect(safeRedirectPath(next, 'es')).toBe('/es')
    }
  })
})
