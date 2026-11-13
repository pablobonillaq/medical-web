import { describe, expect, it } from 'vitest'
import { matchAcceptLanguage, pickLocale } from './negotiate'

describe('matchAcceptLanguage', () => {
  it('finds nothing without a header', () => {
    expect(matchAcceptLanguage(null)).toBeUndefined()
    expect(matchAcceptLanguage('')).toBeUndefined()
  })

  it('compares languages without their region', () => {
    expect(matchAcceptLanguage('en-US')).toBe('en')
    expect(matchAcceptLanguage('ES-mx')).toBe('es')
  })

  it('prefers the language with the highest q value, 1 when missing', () => {
    expect(matchAcceptLanguage('es;q=0.5, en;q=0.9')).toBe('en')
    expect(matchAcceptLanguage('en;q=0.8, es')).toBe('es')
  })

  it('keeps the order of the header between languages with the same q value', () => {
    expect(matchAcceptLanguage('en, es')).toBe('en')
    expect(matchAcceptLanguage('es, en')).toBe('es')
  })

  it('skips unsupported languages, q=0 and broken q values', () => {
    expect(matchAcceptLanguage('fr-FR, de;q=0.9, en;q=0.1')).toBe('en')
    expect(matchAcceptLanguage('es;q=0, en;q=0.2')).toBe('en')
    expect(matchAcceptLanguage('es;q=abc, en;q=0.2')).toBe('en')
    expect(matchAcceptLanguage('fr, *')).toBeUndefined()
  })
})

describe('pickLocale', () => {
  it('uses the language saved in the cookie first', () => {
    expect(pickLocale('en', 'es-MX')).toBe('en')
  })

  it("ignores an unknown saved language and uses the browser's", () => {
    expect(pickLocale('fr', 'en-GB')).toBe('en')
    expect(pickLocale(undefined, 'en-GB')).toBe('en')
  })

  it('falls back to Spanish', () => {
    expect(pickLocale(undefined, 'fr')).toBe('es')
    expect(pickLocale(undefined, null)).toBe('es')
  })
})
