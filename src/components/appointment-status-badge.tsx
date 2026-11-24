import type { AppointmentStatus } from '@/appointments/types'
import { Badge } from '@/components/ui/badge'
import type { Dictionary } from '@/i18n/dictionaries/es'

// The color only helps: the badge always says the status in words
const STATUS_VARIANTS = {
  scheduled: 'neutral',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'primary',
  no_show: 'warning',
} as const satisfies Record<AppointmentStatus, string>

type AppointmentStatusBadgeProps = {
  status: AppointmentStatus
  labels: Dictionary['appointmentPage']['statuses']
}

export function AppointmentStatusBadge({ status, labels }: AppointmentStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{labels[status]}</Badge>
}
