'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import type { Locale } from '@/i18n/config'

type SignInLinkProps = {
  locale: Locale
  label: string
}

// Brings the visitor back to this page after signing in, with ?next=. On the sign-in page
// itself there is nothing to come back to
export function SignInLink({ locale, label }: SignInLinkProps) {
  const pathname = usePathname()
  const loginPath = `/${locale}/login`
  const href =
    pathname === loginPath ? loginPath : `${loginPath}?next=${encodeURIComponent(pathname)}`

  return (
    <Link href={href} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
      {label}
    </Link>
  )
}
