import { DEFAULT_LOCALE, isLocale, type Locale } from './config'

// The supported language the browser prefers most. "en-US,en;q=0.9,es;q=0.8" gives "en":
// languages are ranked by their q value (1 when missing) and compared without the region
export function matchAcceptLanguage(header: string | null): Locale | undefined {
  if (!header) return undefined

  return header
    .split(',')
    .map((range) => {
      const [tag, ...params] = range.split(';').map((part) => part.trim())
      const q = params.find((param) => param.startsWith('q='))
      return { language: tag.split('-')[0].toLowerCase(), quality: q ? Number(q.slice(2)) : 1 }
    })
    .filter(({ quality }) => quality > 0)
    .sort((a, b) => b.quality - a.quality)
    .map(({ language }) => language)
    .find(isLocale)
}

// For a URL without a language: the one used last time, else the browser's, else Spanish
export const pickLocale = (saved: string | undefined, acceptLanguage: string | null): Locale =>
  isLocale(saved) ? saved : (matchAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE)
