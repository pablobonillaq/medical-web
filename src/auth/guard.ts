import { forbidden, redirect } from 'next/navigation'
import { getLocale } from '@/i18n/dictionaries'
import { getSession } from './session'
import type { Role, Session } from './types'

type RequireSessionOptions = {
  // The page that asks, after the language ("/account"), to come back to it after signing in
  path: string
  // Who may see the page. Without it, anyone signed in
  roles?: Role[]
}

// The real check of a protected page, on the server and close to the data: the Proxy only
// looks for the cookie. Signed out, it goes to the sign-in page and comes back here; signed in
// with another role, it answers 403 with the forbidden page
export async function requireSession({ path, roles }: RequireSessionOptions): Promise<Session> {
  const session = await getSession()
  if (!session) {
    const locale = await getLocale()
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}${path}`)}`)
  }
  if (roles && !roles.includes(session.user.role)) forbidden()
  return session
}
