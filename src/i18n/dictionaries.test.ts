import { lang } from 'next/root-params'
import { describe, expect, it, vi } from 'vitest'
import { getDictionary, getLocale } from './dictionaries'
import { en } from './dictionaries/en'
import { es } from './dictionaries/es'

// next/root-params only works inside Next.js: in tests the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

// The paths of every text: "home.title", "theme.legend"...
const keysOf = (value: object, prefix = ''): string[] =>
  Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`],
  )

describe('dictionaries', () => {
  it('have the same texts in every language, none of them empty', () => {
    expect(keysOf(en)).toEqual(keysOf(es))
    expect(keysOf(es).length).toBeGreaterThan(0)

    for (const dictionary of [es, en]) {
      expect(JSON.stringify(dictionary)).not.toContain('""')
    }
  })

  it('load the language of the URL', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    await expect(getLocale()).resolves.toBe('en')
    await expect(getDictionary()).resolves.toBe(en)

    vi.mocked(lang).mockResolvedValue('es')
    await expect(getDictionary()).resolves.toBe(es)
  })

  it('answer an unknown language with a 404', async () => {
    vi.mocked(lang).mockResolvedValue('fr')

    await expect(getLocale()).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })
})
