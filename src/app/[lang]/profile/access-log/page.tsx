import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AccessLog, AccessLogFallback } from '@/components/access-log'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { accessLogPage } = await getDictionary()
  return { title: accessLogPage.title }
}

// Patients only. The heading is in the static shell; the accesses read the session and the
// URL, so they stream in. Without a session the Proxy already sent the visitor to sign in
export default async function AccessLogPage({
  searchParams,
}: PageProps<'/[lang]/profile/access-log'>) {
  const locale = await getLocale()
  const { accessLogPage, account } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{accessLogPage.title}</h1>
        <p className="text-lg text-muted-foreground">{accessLogPage.intro}</p>
      </div>
      <Suspense fallback={<AccessLogFallback label={accessLogPage.loading} />}>
        <AccessLog
          locale={locale}
          labels={accessLogPage}
          roles={account.roles}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  )
}
