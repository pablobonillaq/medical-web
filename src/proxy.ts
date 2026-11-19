import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/auth/constants'
import { isProtectedPath } from '@/auth/protected-paths'
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
    // A quick check before rendering: without the session cookie, a protected page goes
    // straight to the sign-in page with a real 307. The page checks the session again on the
    // server (requireSession), so a fake cookie gets nowhere
    if (
      isProtectedPath(pathname.slice(current.length + 1)) &&
      !request.cookies.has(SESSION_COOKIE)
    ) {
      const login = request.nextUrl.clone()
      login.pathname = `/${current}/login`
      login.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`
      return NextResponse.redirect(login)
    }
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
