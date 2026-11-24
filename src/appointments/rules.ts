import { MIN_PATIENT_NOTICE_HOURS } from '@/config/clinic'
import type { Appointment } from './types'

export type PatientActions = {
  // Only a booked appointment that has not started can be confirmed
  canConfirm: boolean
  // Booked or confirmed, with enough notice
  canCancel: boolean
  // Booked or confirmed and not started, but too close to cancel here: the patient calls
  tooLateToCancel: boolean
}

// What a patient may do with an appointment now, by the API's rules. The API checks again: this
// only decides which buttons to show
export function patientActions(
  { status, startsAt }: Pick<Appointment, 'status' | 'startsAt'>,
  now: Date,
): PatientActions {
  const hoursLeft = (Date.parse(startsAt) - now.getTime()) / 3_600_000
  const active = status === 'scheduled' || status === 'confirmed'
  const upcoming = hoursLeft > 0

  return {
    canConfirm: status === 'scheduled' && upcoming,
    canCancel: active && hoursLeft >= MIN_PATIENT_NOTICE_HOURS,
    tooLateToCancel: active && upcoming && hoursLeft < MIN_PATIENT_NOTICE_HOURS,
  }
}
