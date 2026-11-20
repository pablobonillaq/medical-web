import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { LanguageSwitcher } from './language-switcher'
import { MainNav } from './main-nav'
import { ThemeSwitcher } from './theme-switcher'

type SiteHeaderProps = {
  locale: Locale
  dictionary: Pick<Dictionary, 'metadata' | 'nav' | 'theme' | 'language'>
  // Who is signed in, or the link to sign in (see AccountArea)
  account: ReactNode
}

// The banner of every page: the name of the clinic, a link home, the sections of the site, the account, and the theme and language preferences.
export function SiteHeader({ locale, dictionary, account }: SiteHeaderProps) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href={`/${locale}`} className="py-2 text-xl font-semibold tracking-tight">
              {dictionary.metadata.siteName}
            </Link>
            <MainNav locale={locale} labels={dictionary.nav} />
          </div>
          {account}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <ThemeSwitcher labels={dictionary.theme} />
          <LanguageSwitcher label={dictionary.language.label} current={locale} />
        </div>
      </div>
    </header>
  )
}
