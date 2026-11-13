export const LOCALES = ['es', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'es'

// Remembers the last language used, for the next visit to a URL without one
export const LOCALE_COOKIE = 'locale'

// Each language named in itself, so visitors find theirs even if they don't read the current one
export const LOCALE_NAMES: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
}

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale)
