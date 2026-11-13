import { NextResponse, type NextRequest } from 'next/server'
import { LOCALE_COOKIE, LOCALES } from '@/i18n/config'
import { pickLocale } from '@/i18n/negotiate'

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

// Every page lives under /es or /en. A URL without a language is redirected to the best one,
// keeping the rest of the path and the query: /citas?dia=lunes -> /es/citas?dia=lunes
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const saved = request.cookies.get(LOCALE_COOKIE)?.value
  const current = LOCALES.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )

  if (current) {
    const response = NextResponse.next()
    if (saved !== current) {
      response.cookies.set(LOCALE_COOKIE, current, {
        path: '/',
        maxAge: ONE_YEAR_IN_SECONDS,
        sameSite: 'lax',
      })
    }
    return response
  }

  const url = request.nextUrl.clone()
  const locale = pickLocale(saved, request.headers.get('accept-language'))
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

// Not for the API (/api goes to Express through the rewrites), Next.js internals or files such
// as favicon.ico. It also keeps the proxy away from file uploads, so their size is not limited
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
