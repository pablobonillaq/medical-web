import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPatientAppointments } from '@/appointments/server'
import type { AppointmentPage } from '@/appointments/types'
import { requireSession } from '@/auth/guard'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { clinicDate } from '@/config/clinic'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { getPatient } from '@/patients/patient'
import type { StaffPatient } from '@/patients/types'
import { AppointmentList } from './appointment-list'
import { Pagination, pageParam } from './pagination'

type PatientFileProps = {
  locale: Locale
  labels: Dictionary['patientPage']
  statuses: Dictionary['appointmentPage']['statuses']
  params: Promise<{ id: string }>
  // ?page= is the page of the past appointments
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const UPCOMING_PAGE_SIZE = 100
export const PAST_PAGE_SIZE = 10

// Whole years from "1958-03-14" to "2026-11-26", both dates without time
const yearsBetween = (from: string, to: string) => {
  const years = Number(to.slice(0, 4)) - Number(from.slice(0, 4))
  return to.slice(5) < from.slice(5) ? years - 1 : years
}

// A patient's file for the front desk: who they are, how to reach them, and their appointments,
// the upcoming ones and the past ones page by page. Read on the server with the staff member's
// session; an id that is no patient's is a 404. It reads the URL and the session, so the page
// puts it behind <Suspense>
export async function PatientFile({
  locale,
  labels,
  statuses,
  params,
  searchParams,
}: PatientFileProps) {
  const { id } = await params
  await requireSession({ path: `/front-desk/patients/${id}`, roles: ['employee'] })
  const pastPage = pageParam((await searchParams).page)

  const unavailable = (
    <Alert variant="warning" title={labels.unavailableTitle}>
      {labels.unavailable}
    </Alert>
  )
  let patient: StaffPatient | null
  try {
    patient = await getPatient(id)
  } catch {
    return unavailable
  }
  // First the patient: an id that is no patient's is a 404, not a failure of the appointments
  if (!patient) notFound()

  const now = new Date()
  let upcoming: AppointmentPage
  let past: AppointmentPage
  try {
    ;[upcoming, past] = await Promise.all([
      getPatientAppointments(id, { when: 'upcoming', pageSize: UPCOMING_PAGE_SIZE, now }),
      getPatientAppointments(id, { when: 'past', page: pastPage, pageSize: PAST_PAGE_SIZE, now }),
    ])
  } catch {
    return unavailable
  }

  // "14 de marzo de 1958 (68 años)": a date without time, so in UTC
  const birthDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${patient.birthDate}T00:00:00.000Z`),
  )
  const years = yearsBetween(patient.birthDate, clinicDate(now))
  const age =
    new Intl.PluralRules(locale).select(years) === 'one'
      ? labels.age.one
      : labels.age.other.replace('{count}', String(years))
  // "Correo y WhatsApp", as each language joins a list
  const channels = [
    patient.emailRemindersOptIn && labels.channels.email,
    patient.whatsappOptIn && labels.channels.whatsapp,
  ].filter((channel) => channel !== false)
  const heading = 'text-xl font-semibold tracking-tight'

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="patient-name" className="flex flex-col gap-4">
        <h2 id="patient-name" className="text-2xl font-semibold tracking-tight">
          {patient.firstName} {patient.lastName}
        </h2>
        <dl className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-x-8">
          <dt className="text-sm text-muted-foreground">{labels.birthDate}</dt>
          <dd className="font-medium">
            {birthDate} <span className="font-normal text-muted-foreground">({age})</span>
          </dd>
          <dt className="text-sm text-muted-foreground">{labels.phone}</dt>
          <dd className="font-medium">{patient.phone}</dd>
          <dt className="text-sm text-muted-foreground">{labels.account}</dt>
          <dd className="font-medium">{patient.hasAccount ? patient.email : labels.noAccount}</dd>
          <dt className="text-sm text-muted-foreground">{labels.contactEmail}</dt>
          <dd className="font-medium">{patient.contactEmail ?? labels.noContactEmail}</dd>
          <dt className="text-sm text-muted-foreground">{labels.reminders}</dt>
          <dd className="font-medium">
            {channels.length > 0
              ? new Intl.ListFormat(locale, { type: 'conjunction' }).format(channels)
              : labels.noReminders}
          </dd>
        </dl>
      </section>

      <section aria-labelledby="patient-upcoming" className="flex flex-col gap-4">
        <h2 id="patient-upcoming" className={heading}>
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

      <section aria-labelledby="patient-past" className="flex flex-col gap-4">
        <h2 id="patient-past" className={heading}>
          {labels.past}
        </h2>
        {past.appointments.length === 0 ? (
          <p className="text-muted-foreground">{labels.noPast}</p>
        ) : (
          <AppointmentList appointments={past.appointments} locale={locale} statuses={statuses} />
        )}
        <Pagination
          path={`/${locale}/front-desk/patients/${id}`}
          label={labels.pagination}
          page={pastPage}
          pageSize={PAST_PAGE_SIZE}
          total={past.total}
          previous={labels.newer}
          next={labels.older}
          pageOf={labels.pageOf}
        />
      </section>

      <Link
        href={`/${locale}/front-desk/patients`}
        className={buttonVariants({ variant: 'secondary', className: 'self-start' })}
      >
        {labels.back}
      </Link>
    </div>
  )
}

// aria-busy and a text for screen readers say that the file is loading
export function PatientFileFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
