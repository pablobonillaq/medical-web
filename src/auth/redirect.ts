import type { Locale } from '@/i18n/config'

// Where to go after signing in: the page in ?next=, if it is a page of this site. Anything
// else (https://evil.example, //evil.example, /\evil.example) would be an open redirect, so
// it goes to the home page instead
export function safeRedirectPath(next: string | null, locale: Locale): string {
  const home = `/${locale}`
  if (!next?.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return home
  return next
}
