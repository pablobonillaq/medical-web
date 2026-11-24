// The life of an appointment (medical-api, appointments.constants.ts)
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

// An appointment as the API answers it (medical-api, appointments.types.ts)
export type Appointment = {
  id: string
  status: AppointmentStatus
  // UTC instants
  startsAt: string
  endsAt: string
  notes: string | null
  service: { id: string; name: string; durationMinutes: number }
  doctor: { id: string; firstName: string; lastName: string; specialty: string }
}

// A free time to book: startsAt in UTC, time in the clinic's local time ("09:00")
export type Slot = {
  startsAt: string
  endsAt: string
  time: string
}

// GET /availability: the free times of a doctor for a service on a date
export type Availability = {
  date: string
  timeZone: string
  durationMinutes: number
  slots: Slot[]
}
