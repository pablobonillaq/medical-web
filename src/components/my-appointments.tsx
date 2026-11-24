import Link from 'next/link'
import { appointmentDate, appointmentTime } from '@/appointments/format'
import { getMyAppointments } from '@/appointments/server'
import type { Appointment, AppointmentPage } from '@/appointments/types'
import { requireSession } from '@/auth/guard'
import { CATALOG_LANGUAGE } from '@/catalog/catalog'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { AppointmentStatusBadge } from './appointment-status-badge'

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
  const { page } = await searchParams
  // A page that is not a whole number from 1 on is the first page
  const pastPage = typeof page === 'string' && /^[1-9]\d*$/.test(page) ? Number(page) : 1

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

  const pages = Math.max(1, Math.ceil(past.total / PAST_PAGE_SIZE))
  const pastHref = (to: number) => `/${locale}/appointments${to === 1 ? '' : `?page=${to}`}`
  const pageLink = buttonVariants({ variant: 'secondary', size: 'sm' })

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
          <AppointmentList appointments={past.appointments} locale={locale} statuses={statuses} />
        )}
        {pages > 1 && (
          <nav aria-label={labels.pagination} className="flex flex-wrap items-center gap-3">
            {pastPage > 1 && (
              <Link href={pastHref(pastPage - 1)} className={pageLink}>
                {labels.newer}
              </Link>
            )}
            <p className="text-sm text-muted-foreground">
              {labels.pageOf.replace('{page}', String(pastPage)).replace('{pages}', String(pages))}
            </p>
            {pastPage < pages && (
              <Link href={pastHref(pastPage + 1)} className={pageLink}>
                {labels.older}
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  )
}

type AppointmentListProps = {
  appointments: Appointment[]
  locale: Locale
  statuses: Dictionary['appointmentPage']['statuses']
}

// Each appointment as a card whose title, its date and time, links to it
function AppointmentList({ appointments, locale, statuses }: AppointmentListProps) {
  const catalogLang = locale === CATALOG_LANGUAGE ? undefined : CATALOG_LANGUAGE

  return (
    <ul className="flex flex-col gap-3">
      {appointments.map((appointment) => (
        <li key={appointment.id}>
          <Card className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">
                <Link
                  href={`/${locale}/appointments/${appointment.id}`}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {appointmentDate(appointment.startsAt, locale)},{' '}
                  {appointmentTime(appointment.startsAt, locale)}
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground">
                <span lang={catalogLang}>{appointment.service.name}</span> ·{' '}
                {appointment.doctor.firstName} {appointment.doctor.lastName}
              </p>
            </div>
            <AppointmentStatusBadge status={appointment.status} labels={statuses} />
          </Card>
        </li>
      ))}
    </ul>
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
