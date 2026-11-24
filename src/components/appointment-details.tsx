import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAppointment } from '@/appointments/server'
import type { Appointment, AppointmentStatus } from '@/appointments/types'
import { requireSession } from '@/auth/guard'
import { CATALOG_LANGUAGE } from '@/catalog/catalog'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { CLINIC_TIME_ZONE } from '@/config/clinic'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'

type AppointmentDetailsProps = {
  locale: Locale
  labels: Dictionary['appointmentPage']
  params: Promise<{ id: string }>
}

// The color only helps: the badge always says the status in words
const STATUS_VARIANTS = {
  scheduled: 'neutral',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'primary',
  no_show: 'warning',
} as const satisfies Record<AppointmentStatus, string>

// One of the patient's appointments, read on the server with their session. Someone else's
// appointment, or one that does not exist, is a 404. It reads the URL and the session, so the
// page puts it behind <Suspense>
export async function AppointmentDetails({ locale, labels, params }: AppointmentDetailsProps) {
  const { id } = await params
  await requireSession({ path: `/appointments/${id}`, roles: ['patient'] })

  let appointment: Appointment | null
  try {
    appointment = await getAppointment(id)
  } catch {
    return (
      <Alert variant="warning" title={labels.unavailableTitle}>
        {labels.unavailable}
      </Alert>
    )
  }
  if (!appointment) notFound()

  const startsAt = new Date(appointment.startsAt)
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: CLINIC_TIME_ZONE }).format(startsAt)
  const duration = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'long',
  }).format(appointment.service.durationMinutes)
  const catalogLang = locale === CATALOG_LANGUAGE ? undefined : CATALOG_LANGUAGE
  const { doctor, service } = appointment

  return (
    <div className="flex flex-col gap-8">
      <dl className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-x-8">
        <dt className="text-sm text-muted-foreground">{labels.status}</dt>
        <dd>
          <Badge variant={STATUS_VARIANTS[appointment.status]}>
            {labels.statuses[appointment.status]}
          </Badge>
        </dd>
        <dt className="text-sm text-muted-foreground">{labels.date}</dt>
        <dd className="font-medium">{format({ dateStyle: 'full' })}</dd>
        <dt className="text-sm text-muted-foreground">{labels.time}</dt>
        <dd className="font-medium">
          {format({ timeStyle: 'short' })}{' '}
          <span className="font-normal text-muted-foreground">({labels.timeZoneNote})</span>
        </dd>
        <dt className="text-sm text-muted-foreground">{labels.service}</dt>
        <dd className="font-medium">
          <span lang={catalogLang}>{service.name}</span>
          <span className="font-normal text-muted-foreground"> · {duration}</span>
        </dd>
        <dt className="text-sm text-muted-foreground">{labels.doctor}</dt>
        <dd className="font-medium">
          {doctor.firstName} {doctor.lastName}
          <span className="font-normal text-muted-foreground" lang={catalogLang}>
            {' '}
            · {doctor.specialty}
          </span>
        </dd>
        {appointment.notes && (
          <>
            <dt className="text-sm text-muted-foreground">{labels.notes}</dt>
            <dd className="whitespace-pre-line">{appointment.notes}</dd>
          </>
        )}
      </dl>
      <Link
        href={`/${locale}/appointments/new`}
        className={buttonVariants({ variant: 'secondary', className: 'self-start' })}
      >
        {labels.bookAnother}
      </Link>
    </div>
  )
}

// aria-busy and a text for screen readers say that the appointment is loading
export function AppointmentDetailsFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-6 w-56" />
    </div>
  )
}
