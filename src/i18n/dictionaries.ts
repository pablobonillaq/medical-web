import { notFound } from 'next/navigation'
import { lang } from 'next/root-params'
import { isLocale, type Locale } from './config'
import type { Dictionary } from './dictionaries/es'

// Each language is loaded only when a page asks for it, and only on the server: the texts reach
// the browser as HTML, or as props of the client components that need them
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  es: () => import('./dictionaries/es').then((module) => module.es),
  en: () => import('./dictionaries/en').then((module) => module.en),
}

// The language of the current page, from the [lang] segment of the URL. Any Server Component can
// read it without props. An unknown language is a 404
export async function getLocale(): Promise<Locale> {
  const locale = await lang()
  if (!isLocale(locale)) notFound()
  return locale
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]()
}
