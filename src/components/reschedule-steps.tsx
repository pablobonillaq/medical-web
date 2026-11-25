import Form from 'next/form'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { appointmentDate, appointmentTime, calendarDate } from '@/appointments/format'
import { patientActions } from '@/appointments/rules'
import { getAppointment, getAvailability } from '@/appointments/server'
import type { Appointment } from '@/appointments/types'
import { requireSession } from '@/auth/guard'
import { CATALOG_LANGUAGE } from '@/catalog/catalog'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { addDays, clinicDate, MAX_DAYS_AHEAD } from '@/config/clinic'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { RescheduleForm } from './reschedule-form'

type RescheduleStepsProps = {
  locale: Locale
  labels: Dictionary['reschedulePage']
  params: Promise<{ id: string }>
  // ?date=: the day the patient wants to see
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const stepHeading = 'text-xl font-semibold tracking-tight'

// A new time for one of the patient's appointments: with the same doctor and service, so only
// the date and the time change. The date is a GET form, as when booking; the times of the
// appointment's own day show from the start, since often only the time changes. Someone else's
// appointment, or one that does not exist, is a 404. It reads the URL and the session, so the
// page puts it behind <Suspense>
export async function RescheduleSteps({
  locale,
  labels,
  params,
  searchParams,
}: RescheduleStepsProps) {
  const { id } = await params
  await requireSession({ path: `/appointments/${id}/reschedule`, roles: ['patient'] })

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

  const catalogLang = locale === CATALOG_LANGUAGE ? undefined : CATALOG_LANGUAGE
  const { doctor, service } = appointment
  const current = (
    <section aria-labelledby="reschedule-current" className="flex flex-col gap-1">
      <h2 id="reschedule-current" className={stepHeading}>
        {labels.current}
      </h2>
      <p className="font-medium">
        {appointmentDate(appointment.startsAt, locale)},{' '}
        {appointmentTime(appointment.startsAt, locale)}
      </p>
      <p className="text-sm text-muted-foreground">
        <span lang={catalogLang}>{service.name}</span> · {doctor.firstName} {doctor.lastName}
      </p>
    </section>
  )
  const back = (
    <Link
      href={`/${locale}/appointments/${id}`}
      className={buttonVariants({ variant: 'secondary', className: 'self-start' })}
    >
      {labels.back}
    </Link>
  )

  // Decided now, on the server; the API checks again when the patient sends the new time
  if (!patientActions(appointment, new Date()).canReschedule) {
    return (
      <div className="flex flex-col gap-8">
        {current}
        <Alert variant="warning" title={labels.notAllowedTitle}>
          {labels.notAllowed}
        </Alert>
        {back}
      </div>
    )
  }

  const { date: picked } = await searchParams
  const today = clinicDate(new Date())
  const lastDay = addDays(today, MAX_DAYS_AHEAD)
  // The date in the URL, or the day of the appointment
  const date =
    typeof picked === 'string' && picked !== ''
      ? picked
      : clinicDate(new Date(appointment.startsAt))
  const times = await timeStep({
    appointment,
    locale,
    labels,
    date,
    lastDay: calendarDate(lastDay, locale),
  })

  return (
    <div className="flex flex-col gap-10">
      {current}
      <section aria-labelledby="reschedule-date" className="flex flex-col gap-4">
        <h2 id="reschedule-date" className={stepHeading}>
          1. {labels.dateStep}
        </h2>
        <Form action={`/${locale}/appointments/${id}/reschedule`} className="flex flex-col gap-4">
          <div className="w-full sm:w-64">
            <Input
              type="date"
              name="date"
              label={labels.dateLabel}
              hint={labels.dateHint.replace('{last}', calendarDate(lastDay, locale))}
              min={today}
              max={lastDay}
              defaultValue={date}
            />
          </div>
          {/* A plain <button>: <Button> has a click handler, which a Server Component cannot pass */}
          <button
            type="submit"
            className={buttonVariants({ variant: 'secondary', className: 'self-start' })}
          >
            {labels.showTimes}
          </button>
        </Form>
      </section>
      <section aria-labelledby="reschedule-time" className="flex flex-col gap-4">
        <h2 id="reschedule-time" className={stepHeading}>
          2. {labels.timeStep}
        </h2>
        {times}
      </section>
      {back}
    </div>
  )
}

type TimeStepOptions = {
  appointment: Appointment
  locale: Locale
  labels: Dictionary['reschedulePage']
  date: string
  lastDay: string
}

// The free times of the same doctor for the same service on the date, or why there are none.
// A function and not a component, so the steps render in one pass (as in BookingSteps)
async function timeStep({ appointment, locale, labels, date, lastDay }: TimeStepOptions) {
  let availability
  try {
    availability = await getAvailability({
      doctorId: appointment.doctor.id,
      serviceId: appointment.service.id,
      date,
    })
  } catch {
    return (
      <Alert variant="warning" title={labels.unavailableTitle}>
        {labels.unavailable}
      </Alert>
    )
  }

  // The API did not accept the date: in the past, too far ahead, or not a date at all
  if (!availability) {
    return <p className="text-danger">{labels.invalidDate.replace('{last}', lastDay)}</p>
  }
  // The current time is never a new one
  const slots = availability.slots.filter(({ startsAt }) => startsAt !== appointment.startsAt)
  if (slots.length === 0) {
    return <p className="text-muted-foreground">{labels.noTimes}</p>
  }

  return (
    <RescheduleForm
      appointmentId={appointment.id}
      locale={locale}
      labels={labels}
      legend={labels.timeLabel.replace('{date}', calendarDate(availability.date, locale))}
      slots={slots.map(({ startsAt }) => ({
        startsAt,
        label: appointmentTime(startsAt, locale),
      }))}
    />
  )
}

// aria-busy and a text for screen readers say that the appointment is loading
export function RescheduleStepsFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-11 w-full sm:w-64" />
    </div>
  )
}
