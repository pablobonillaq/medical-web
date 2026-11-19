'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SessionUser } from '@/auth/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectSigningOut, signOut } from '@/store/session-slice'

type AccountMenuProps = {
  user: SessionUser
  locale: Locale
  labels: Dictionary['account']
}

// Who is signed in, with which role, a link to their account and the button to sign out
export function AccountMenu({ user, locale, labels }: AccountMenuProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const showToast = useToast()
  const signingOut = useAppSelector(selectSigningOut)

  const onSignOut = async () => {
    const result = await dispatch(signOut())
    if (signOut.fulfilled.match(result)) {
      // To the home page; refresh() renders the server components again, now without a session
      router.replace(`/${locale}`)
      router.refresh()
    } else {
      showToast({ title: labels.signOutFailed, variant: 'danger' })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm">
        <VisuallyHidden>{labels.signedInAs} </VisuallyHidden>
        <span className="font-medium">{user.email}</span>
        <span className="text-muted-foreground"> · {labels.roles[user.role]}</span>
      </p>
      <Link
        href={`/${locale}/account`}
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
      >
        {labels.myAccount}
      </Link>
      <Button
        variant="secondary"
        size="sm"
        loading={signingOut}
        loadingLabel={labels.signingOut}
        onClick={onSignOut}
      >
        {labels.signOut}
      </Button>
    </div>
  )
}
