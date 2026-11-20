import { getSession } from '@/auth/session'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { AccountMenu } from './account-menu'
import { SessionWatcher } from './session-watcher'
import { SignInLink } from './sign-in-link'
import { Skeleton } from './ui/skeleton'

type AccountAreaProps = {
  locale: Locale
  labels: Dictionary['account']
}

// The part of the header that depends on the session. It reads the request (the cookie), so it
// streams in behind <Suspense> and the rest of the page stays in the static shell
export async function AccountArea({ locale, labels }: AccountAreaProps) {
  const session = await getSession()

  return session ? (
    <>
      <AccountMenu user={session.user} locale={locale} labels={labels} />
      {/* Starts the countdown to the end of the session (see sessionExpirySaga) */}
      <SessionWatcher expiresAt={session.expiresAt} />
    </>
  ) : (
    <SignInLink locale={locale} label={labels.signIn} />
  )
}

// Holds the place of the account area while the session is read, so the header does not move
export function AccountAreaFallback() {
  return <Skeleton className="h-9 w-32" />
}
