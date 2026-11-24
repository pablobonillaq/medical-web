import Form from 'next/form'
import { getAvailability } from '@/appointments/server'
import { requireSession } from '@/auth/guard'
import { CATALOG_LANGUAGE, getDoctors, getServices } from '@/catalog/catalog'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { addDays, CLINIC_TIME_ZONE, clinicDate, MAX_DAYS_AHEAD } from '@/config/clinic'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { SlotPickerForm } from './slot-picker-form'

type BookingStepsProps = {
  locale: Locale
  labels: Dictionary['bookingPage']
  // ?service=, ?doctor= and ?date=: what the patient chose in the earlier steps
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const stepHeading = 'text-xl font-semibold tracking-tight'

// Booking, one step at a time: the service, then the doctor and the date, then the time. Each
// step is a GET form, so the choices live in the URL: the steps work without JavaScript, and
// going back in the browser goes back one step. It reads the session, so the page puts it
// behind <Suspense>
export async function BookingSteps({ locale, labels, searchParams }: BookingStepsProps) {
  await requireSession({ path: '/appointments/new', roles: ['patient'] })
  const [query, services, doctors] = await Promise.all([searchParams, getServices(), getDoctors()])

  if (!services || !doctors) {
    return (
      <Alert variant="warning" title={labels.unavailableTitle}>
        {labels.unavailable}
      </Alert>
    )
  }

  // Only what makes sense: a service the clinic offers, a doctor who offers it, a written date
  const pick = (name: string) => {
    const value = query[name]
    return typeof value === 'string' && value !== '' ? value : undefined
  }
  const service = services.find(({ id }) => id === pick('service'))
  const offering = service
    ? doctors.filter((doctor) => doctor.services.some(({ id }) => id === service.id))
    : []
  const doctor = offering.find(({ id }) => id === pick('doctor'))
  const date = pick('date')

  const today = clinicDate(new Date())
  const lastDay = addDays(today, MAX_DAYS_AHEAD)
  const action = `/${locale}/appointments/new`
  const catalogLang = locale === CATALOG_LANGUAGE ? undefined : CATALOG_LANGUAGE
  // A date without time, written in the language of the page: "jueves, 26 de noviembre de 2026"
  const longDate = (day: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(
      new Date(`${day}T12:00:00.000Z`),
    )
  const submit = buttonVariants({ variant: 'secondary', className: 'self-start' })
  // The free times are read only once the patient chose a doctor and a date
  const times =
    service &&
    doctor &&
    date &&
    (await timeStep({
      locale,
      labels,
      doctorId: doctor.id,
      serviceId: service.id,
      date,
      lastDay: longDate(lastDay),
      longDate,
    }))

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="step-service" className="flex flex-col gap-4">
        <h2 id="step-service" className={stepHeading}>
          1. {labels.serviceStep}
        </h2>
        <Form action={action} className="flex flex-col gap-4">
          <div className="w-full sm:w-96">
            <Select name="service" label={labels.serviceLabel} defaultValue={service?.id ?? ''}>
              <option value="" disabled>
                {labels.chooseService}
              </option>
              {services.map(({ id, name }) => (
                <option key={id} value={id} lang={catalogLang}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          {/* A plain <button>: <Button> has a click handler, which a Server Component cannot pass */}
          <button type="submit" className={submit}>
            {labels.continue}
          </button>
        </Form>
      </section>

      {service && (
        <section aria-labelledby="step-doctor" className="flex flex-col gap-4">
          <h2 id="step-doctor" className={stepHeading}>
            2. {labels.doctorStep}
          </h2>
          {offering.length === 0 ? (
            <p className="text-muted-foreground">{labels.noDoctors}</p>
          ) : (
            <Form action={action} className="flex flex-col gap-5">
              <input type="hidden" name="service" value={service.id} />
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium">{labels.doctorLabel}</legend>
                {offering.map((option, index) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-input bg-surface px-4 py-3 has-checked:border-primary has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
                  >
                    <input
                      type="radio"
                      name="doctor"
                      value={option.id}
                      // The chosen doctor, or the first one: a radio group always has a choice
                      defaultChecked={doctor ? option.id === doctor.id : index === 0}
                      className="size-4 accent-primary"
                    />
                    <span>
                      <span className="block font-medium">
                        {option.firstName} {option.lastName}
                      </span>
                      <span className="block text-sm text-muted-foreground" lang={catalogLang}>
                        {option.specialty}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="w-full sm:w-64">
                <Input
                  type="date"
                  name="date"
                  label={labels.dateLabel}
                  hint={labels.dateHint.replace('{last}', longDate(lastDay))}
                  min={today}
                  max={lastDay}
                  defaultValue={date ?? today}
                />
              </div>
              <button type="submit" className={submit}>
                {labels.showTimes}
              </button>
            </Form>
          )}
        </section>
      )}

      {times && (
        <section aria-labelledby="step-time" className="flex flex-col gap-4">
          <h2 id="step-time" className={stepHeading}>
            3. {labels.timeStep}
          </h2>
          {times}
        </section>
      )}
    </div>
  )
}

type TimeStepOptions = {
  locale: Locale
  labels: Dictionary['bookingPage']
  doctorId: string
  serviceId: string
  date: string
  lastDay: string
  longDate: (day: string) => string
}

// The content of the last step: the free times of the doctor on the date, or why there are
// none. A function and not a component, so the steps render in one pass
async function timeStep({
  locale,
  labels,
  doctorId,
  serviceId,
  date,
  lastDay,
  longDate,
}: TimeStepOptions) {
  let availability
  try {
    availability = await getAvailability({ doctorId, serviceId, date })
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
  if (availability.slots.length === 0) {
    return <p className="text-muted-foreground">{labels.noTimes}</p>
  }

  // "9:00", "9:00 AM": the clinic's time, written as each language does
  const time = new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: CLINIC_TIME_ZONE })

  return (
    <SlotPickerForm
      locale={locale}
      labels={labels}
      doctorId={doctorId}
      serviceId={serviceId}
      legend={labels.timeLabel.replace('{date}', longDate(availability.date))}
      slots={availability.slots.map(({ startsAt }) => ({
        startsAt,
        label: time.format(new Date(startsAt)),
      }))}
    />
  )
}

// aria-busy and a text for screen readers say that the steps are loading
export function BookingStepsFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-11 w-full sm:w-96" />
    </div>
  )
}
