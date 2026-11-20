'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { isProtectedPath } from '@/auth/protected-paths'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectExpiresAt, selectExpiryStatus, warningDismissed } from '@/store/session-expiry-slice'
import { signOut } from '@/store/session-slice'

type SessionExpiryDialogProps = {
  labels: Dictionary['sessionExpiry']
  locale: Locale
}

// Warns before the session ends (WCAG 2.2.1), and says so when it ends. The API has no way to
// extend a session, so the way to keep going is to sign in again
export function SessionExpiryDialog({ labels, locale }: SessionExpiryDialogProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const showToast = useToast()
  const status = useAppSelector(selectExpiryStatus)
  const expiresAt = useAppSelector(selectExpiresAt)
  const loginPath = `/${locale}/login?next=${encodeURIComponent(pathname)}`

  // The session ended: announce it, and leave a protected page for the sign-in page, coming
  // back here afterwards. refresh() renders the server components again, now without a session
  useEffect(() => {
    if (status !== 'expired') return
    // An error toast stays until it is closed: the message cannot vanish before it is read
    showToast({ title: labels.expired, variant: 'danger' })
    if (isProtectedPath(pathname.slice(locale.length + 1))) router.replace(loginPath)
    router.refresh()
  }, [status, showToast, labels, pathname, locale, router, loginPath])

  const signInAgain = async () => {
    await dispatch(signOut())
    router.replace(loginPath)
    router.refresh()
  }

  const endsAt =
    expiresAt &&
    new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
      new Date(expiresAt),
    )

  return (
    <Dialog
      open={status === 'warning'}
      onClose={() => dispatch(warningDismissed())}
      title={labels.title}
      description={labels.description.replace('{time}', endsAt ?? '')}
      closeLabel={labels.close}
    >
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => dispatch(warningDismissed())}>
          {labels.stay}
        </Button>
        <Button onClick={signInAgain}>{labels.signInAgain}</Button>
      </div>
    </Dialog>
  )
}
