import type { Appointment, Availability } from '@/appointments/types'
import { testDoctors, testServices } from './catalog'

// The free times of Luis Ruiz for an ultrasound on November 26, 2026 (9:00 and 9:45 at the clinic)
export const testAvailability: Availability = {
  date: '2026-11-26',
  timeZone: 'America/Mexico_City',
  durationMinutes: 45,
  slots: [
    { startsAt: '2026-11-26T15:00:00.000Z', endsAt: '2026-11-26T15:45:00.000Z', time: '09:00' },
    { startsAt: '2026-11-26T15:45:00.000Z', endsAt: '2026-11-26T16:30:00.000Z', time: '09:45' },
  ],
}

// An appointment of the fictitious patient, as the API answers it
export const testAppointment: Appointment = {
  id: '0190a7b2-4444-7000-8000-000000000001',
  status: 'scheduled',
  startsAt: '2026-11-26T15:00:00.000Z',
  endsAt: '2026-11-26T15:45:00.000Z',
  notes: null,
  service: { id: testServices[1].id, name: 'Ultrasonido', durationMinutes: 45 },
  doctor: {
    id: testDoctors[1].id,
    firstName: 'Luis',
    lastName: 'Ruiz',
    specialty: 'Radiología',
  },
}
