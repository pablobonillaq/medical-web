import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AccountDetails, AccountDetailsFallback } from '@/components/account-details'
import { getDictionary } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { accountPage } = await getDictionary()
  return { title: accountPage.title }
}

// The heading is in the static shell; the details read the session, so they stream in.
// Without a session the Proxy already sent the visitor to sign in; AccountDetails checks again
export default async function AccountPage() {
  const { accountPage, account } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{accountPage.title}</h1>
      <Suspense fallback={<AccountDetailsFallback label={accountPage.loading} />}>
        <AccountDetails labels={accountPage} roles={account.roles} />
      </Suspense>
    </div>
  )
}
