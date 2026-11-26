import { ApiError } from '@/api/client'
import { serverApiRequest } from '@/api/server'
import type { Appointment, AppointmentPage, Availability } from './types'

type AvailabilityQuery = {
  doctorId: string
  serviceId: string
  date: string
}

// The free times of a doctor for a service on a date, read on the server with the patient's
// session. null when the API does not accept the question (a date in the past or too far ahead,
// a doctor who does not offer the service); other failures throw, as in serverApiRequest
export async function getAvailability({
  doctorId,
  serviceId,
  date,
}: AvailabilityQuery): Promise<Availability | null> {
  const query = new URLSearchParams({ doctorId, serviceId, date })
  try {
    return await serverApiRequest<Availability>(`/availability?${query}`)
  } catch (error) {
    if (error instanceof ApiError && [400, 404].includes(error.status)) return null
    throw error
  }
}

// One appointment of the signed-in patient. null when it does not exist or is someone else's:
// the API answers 404 for both, so it never reveals other patients' appointments
export async function getAppointment(id: string): Promise<Appointment | null> {
  try {
    const { appointment } = await serverApiRequest<{ appointment: Appointment }>(
      `/appointments/${encodeURIComponent(id)}`,
    )
    return appointment
  } catch (error) {
    if (error instanceof ApiError && [400, 404].includes(error.status)) return null
    throw error
  }
}

type AppointmentsQuery = {
  // upcoming: from now on, the nearest first. past: before now, the latest first
  when: 'upcoming' | 'past'
  page?: number
  pageSize: number
  now: Date
}

const appointmentsQuery = ({ when, page = 1, pageSize, now }: AppointmentsQuery) =>
  new URLSearchParams({
    [when === 'upcoming' ? 'from' : 'to']: now.toISOString(),
    order: when === 'upcoming' ? 'asc' : 'desc',
    page: String(page),
    pageSize: String(pageSize),
  })

// One page of the signed-in patient's appointments, read on the server with their session. The
// API only answers with the patient's own, whatever the query says
export async function getMyAppointments(query: AppointmentsQuery): Promise<AppointmentPage> {
  return serverApiRequest<AppointmentPage>(`/appointments?${appointmentsQuery(query)}`)
}

// One page of a patient's appointments, for the front desk, read on the server with the staff
// member's session
export async function getPatientAppointments(
  patientId: string,
  query: AppointmentsQuery,
): Promise<AppointmentPage> {
  const search = appointmentsQuery(query)
  search.set('patientId', patientId)
  return serverApiRequest<AppointmentPage>(`/appointments?${search}`)
}
