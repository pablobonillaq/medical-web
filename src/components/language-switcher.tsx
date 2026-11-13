'use client'

import { usePathname } from 'next/navigation'
import { useId } from 'react'
import { LOCALE_NAMES, LOCALES, type Locale } from '@/i18n/config'

type LanguageSwitcherProps = {
  label: string
  current: Locale
}

// Links to the same page in each language. Each name is marked with its own language (lang), so
// screen readers pronounce "English" in English. Plain <a> instead of <Link>: another language
// is another root layout (a new <html lang>), and a prefetch must not count as choosing it
export function LanguageSwitcher({ label, current }: LanguageSwitcherProps) {
  const labelId = useId()
  // "/es/citas" -> "/citas"
  const rest = usePathname().slice(current.length + 1)

  return (
    <nav aria-labelledby={labelId}>
      <p id={labelId} className="mb-1 text-sm font-medium">
        {label}
      </p>
      <ul className="inline-flex gap-1 rounded-lg border border-input bg-surface p-1">
        {LOCALES.map((locale) => (
          <li key={locale}>
            <a
              href={`/${locale}${rest}`}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? 'page' : undefined}
              className="block rounded-md px-3 py-1.5 text-sm hover:bg-background aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
            >
              {LOCALE_NAMES[locale]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
