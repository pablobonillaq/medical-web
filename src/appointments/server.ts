import { ApiError } from '@/api/client'
import { serverApiRequest } from '@/api/server'
import type { Appointment, Availability } from './types'

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
