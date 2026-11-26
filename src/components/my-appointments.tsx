import Link from 'next/link'
import { getMyAppointments } from '@/appointments/server'
import type { Appointment, AppointmentPage } from '@/appointments/types'
import { requireSession } from '@/auth/guard'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { Pagination, pageParam } from './pagination'
import { AppointmentList } from './appointment-list'

type MyAppointmentsProps = {
  locale: Locale
  labels: Dictionary['appointmentsPage']
  statuses: Dictionary['appointmentPage']['statuses']
  // ?page= is the page of the past appointments
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// Upcoming appointments fit on one page; the history is paginated
const UPCOMING_PAGE_SIZE = 100
export const PAST_PAGE_SIZE = 10

// The patient's appointments: the upcoming ones, the nearest first, and the past ones, the latest
// first and page by page. It reads the session and the URL, so the page puts it behind <Suspense>
export async function MyAppointments({
  locale,
  labels,
  statuses,
  searchParams,
}: MyAppointmentsProps) {
  await requireSession({ path: '/appointments', roles: ['patient'] })
  const pastPage = pageParam((await searchParams).page)

  const now = new Date()
  let upcoming: AppointmentPage
  let past: AppointmentPage
  try {
    ;[upcoming, past] = await Promise.all([
      getMyAppointments({ when: 'upcoming', pageSize: UPCOMING_PAGE_SIZE, now }),
      getMyAppointments({ when: 'past', page: pastPage, pageSize: PAST_PAGE_SIZE, now }),
    ])
  } catch {
    return (
      <Alert variant="warning" title={labels.unavailableTitle}>
        {labels.unavailable}
      </Alert>
    )
  }

  // Each appointment opens the patient's page for it
  const patientHref = ({ id }: Appointment) => `/${locale}/appointments/${id}`

  return (
    <div className="flex flex-col gap-10">
      <Link
        href={`/${locale}/appointments/new`}
        className={buttonVariants({ className: 'self-start' })}
      >
        {labels.book}
      </Link>

      <section aria-labelledby="appointments-upcoming" className="flex flex-col gap-4">
        <h2 id="appointments-upcoming" className="text-xl font-semibold tracking-tight">
          {labels.upcoming}
        </h2>
        {upcoming.appointments.length === 0 ? (
          <p className="text-muted-foreground">{labels.noUpcoming}</p>
        ) : (
          <AppointmentList
            appointments={upcoming.appointments}
            locale={locale}
            statuses={statuses}
            href={patientHref}
          />
        )}
      </section>

      <section aria-labelledby="appointments-past" className="flex flex-col gap-4">
        <h2 id="appointments-past" className="text-xl font-semibold tracking-tight">
          {labels.past}
        </h2>
        {past.appointments.length === 0 ? (
          <p className="text-muted-foreground">{labels.noPast}</p>
        ) : (
          <AppointmentList
            appointments={past.appointments}
            locale={locale}
            statuses={statuses}
            href={patientHref}
          />
        )}
        <Pagination
          path={`/${locale}/appointments`}
          label={labels.pagination}
          page={pastPage}
          pageSize={PAST_PAGE_SIZE}
          total={past.total}
          previous={labels.newer}
          next={labels.older}
          pageOf={labels.pageOf}
        />
      </section>
    </div>
  )
}

// aria-busy and a text for screen readers say that the appointments are loading
export function MyAppointmentsFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton className="h-11 w-40" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
