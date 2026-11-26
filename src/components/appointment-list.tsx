import Link from 'next/link'
import { appointmentDate, appointmentTime } from '@/appointments/format'
import type { Appointment } from '@/appointments/types'
import { CATALOG_LANGUAGE } from '@/catalog/catalog'
import { Card } from '@/components/ui/card'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { AppointmentStatusBadge } from './appointment-status-badge'

type AppointmentListProps = {
  appointments: Appointment[]
  locale: Locale
  statuses: Dictionary['appointmentPage']['statuses']
  // Where each appointment opens, if it does
  href?: (appointment: Appointment) => string
}

// Each appointment as a card, titled with its date and time (a link when it opens somewhere):
// the service, the doctor and the status
export function AppointmentList({ appointments, locale, statuses, href }: AppointmentListProps) {
  const catalogLang = locale === CATALOG_LANGUAGE ? undefined : CATALOG_LANGUAGE

  return (
    <ul className="flex flex-col gap-3">
      {appointments.map((appointment) => {
        const when = `${appointmentDate(appointment.startsAt, locale)}, ${appointmentTime(appointment.startsAt, locale)}`
        return (
          <li key={appointment.id}>
            <Card className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">
                  {href ? (
                    <Link
                      href={href(appointment)}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      {when}
                    </Link>
                  ) : (
                    when
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  <span lang={catalogLang}>{appointment.service.name}</span> ·{' '}
                  {appointment.doctor.firstName} {appointment.doctor.lastName}
                </p>
              </div>
              <AppointmentStatusBadge status={appointment.status} labels={statuses} />
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
