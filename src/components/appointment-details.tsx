import Link from 'next/link'
import { notFound } from 'next/navigation'
import { appointmentDate, appointmentTime } from '@/appointments/format'
import { patientActions } from '@/appointments/rules'
import { getAppointment } from '@/appointments/server'
import type { Appointment } from '@/appointments/types'
import { requireSession } from '@/auth/guard'
import { CATALOG_LANGUAGE } from '@/catalog/catalog'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { AppointmentActions } from './appointment-actions'
import { AppointmentStatusBadge } from './appointment-status-badge'

type AppointmentDetailsProps = {
  locale: Locale
  labels: Dictionary['appointmentPage']
  params: Promise<{ id: string }>
}

// One of the patient's appointments, read on the server with their session, with what the
// patient may do with it now. Someone else's appointment, or one that does not exist, is a 404.
// It reads the URL and the session, so the page puts it behind <Suspense>
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

  const date = appointmentDate(appointment.startsAt, locale)
  const time = appointmentTime(appointment.startsAt, locale)
  // Decided now, on the server; the API checks again when the patient acts
  const actions = patientActions(appointment, new Date())
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
          <AppointmentStatusBadge status={appointment.status} labels={labels.statuses} />
        </dd>
        <dt className="text-sm text-muted-foreground">{labels.date}</dt>
        <dd className="font-medium">{date}</dd>
        <dt className="text-sm text-muted-foreground">{labels.time}</dt>
        <dd className="font-medium">
          {time} <span className="font-normal text-muted-foreground">({labels.timeZoneNote})</span>
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
      {(actions.canConfirm || actions.canCancel || actions.tooLateToCancel) && (
        <AppointmentActions
          appointmentId={appointment.id}
          actions={actions}
          labels={labels}
          date={date}
          time={time}
        />
      )}
      <Link
        href={`/${locale}/appointments`}
        className={buttonVariants({ variant: 'secondary', className: 'self-start' })}
      >
        {labels.myAppointments}
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
