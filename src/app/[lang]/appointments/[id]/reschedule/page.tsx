import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RescheduleSteps, RescheduleStepsFallback } from '@/components/reschedule-steps'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

// Like the appointment page: the id is only known when someone opens it (see ../page.tsx)
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const { reschedulePage } = await getDictionary()
  return { title: reschedulePage.title }
}

// Patients only. The heading is in the static shell; the appointment and its free times read
// the URL and the session, so they stream in
export default async function ReschedulePage({
  params,
  searchParams,
}: PageProps<'/[lang]/appointments/[id]/reschedule'>) {
  const locale = await getLocale()
  const { reschedulePage } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{reschedulePage.title}</h1>
        <p className="text-lg text-muted-foreground">{reschedulePage.intro}</p>
      </div>
      <Suspense fallback={<RescheduleStepsFallback label={reschedulePage.loading} />}>
        <RescheduleSteps
          locale={locale}
          labels={reschedulePage}
          params={params}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  )
}
