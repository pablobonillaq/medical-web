import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MyAppointments, MyAppointmentsFallback } from '@/components/my-appointments'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { appointmentsPage } = await getDictionary()
  return { title: appointmentsPage.title }
}

// Patients only. The heading is in the static shell; the appointments read the session and the
// URL, so they stream in. Without a session the Proxy already sent the visitor to sign in
export default async function AppointmentsPage({
  searchParams,
}: PageProps<'/[lang]/appointments'>) {
  const locale = await getLocale()
  const { appointmentsPage, appointmentPage } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{appointmentsPage.title}</h1>
        <p className="text-lg text-muted-foreground">{appointmentsPage.intro}</p>
      </div>
      <Suspense fallback={<MyAppointmentsFallback label={appointmentsPage.loading} />}>
        <MyAppointments
          locale={locale}
          labels={appointmentsPage}
          statuses={appointmentPage.statuses}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  )
}
