import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AppointmentDetails, AppointmentDetailsFallback } from '@/components/appointment-details'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

// The id is only known when someone opens an appointment, and the header reads the whole URL
// (usePathname), so this page has no static shell to check. It still prerenders and streams
// (see the instant docs); [...rest] does the same
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const { appointmentPage } = await getDictionary()
  return { title: appointmentPage.title }
}

// Patients only. The heading is in the static shell; the appointment reads the URL and the
// session, so it streams in
export default async function AppointmentPage({ params }: PageProps<'/[lang]/appointments/[id]'>) {
  const locale = await getLocale()
  const { appointmentPage } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{appointmentPage.title}</h1>
      <Suspense fallback={<AppointmentDetailsFallback label={appointmentPage.loading} />}>
        <AppointmentDetails locale={locale} labels={appointmentPage} params={params} />
      </Suspense>
    </div>
  )
}
