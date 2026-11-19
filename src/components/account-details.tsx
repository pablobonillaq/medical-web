import { requireSession } from '@/auth/guard'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import type { Dictionary } from '@/i18n/dictionaries/es'

type AccountDetailsProps = {
  labels: Dictionary['accountPage']
  roles: Dictionary['account']['roles']
}

// The details of who is signed in. It reads the session, so the page puts it behind <Suspense>
export async function AccountDetails({ labels, roles }: AccountDetailsProps) {
  // Anyone signed in may see their own account
  const { user } = await requireSession({ path: '/account' })

  return (
    <dl className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-x-8">
      <dt className="text-sm text-muted-foreground">{labels.email}</dt>
      <dd className="font-medium">{user.email}</dd>
      <dt className="text-sm text-muted-foreground">{labels.role}</dt>
      <dd className="font-medium">{roles[user.role]}</dd>
    </dl>
  )
}

// aria-busy and a text for screen readers say that the details are loading
export function AccountDetailsFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-6 w-40" />
    </div>
  )
}
