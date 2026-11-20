'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'

type MainNavProps = {
  locale: Locale
  labels: Dictionary['nav']
}

// The public sections of the site. aria-current marks the section of the current page, for
// screen readers and for the style; a page inside a section (/services/…) counts as that section
export function MainNav({ locale, labels }: MainNavProps) {
  const pathname = usePathname()
  const links = [{ href: `/${locale}/services`, label: labels.services }]

  return (
    <nav aria-label={labels.label}>
      <ul className="flex flex-wrap gap-1">
        {links.map(({ href, label }) => {
          const current = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-background aria-[current=page]:text-primary aria-[current=page]:underline aria-[current=page]:underline-offset-4"
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
