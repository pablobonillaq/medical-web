import { ApiError } from '@/api/client'
import { serverApiRequest } from '@/api/server'
import type { StaffPatient } from './types'

// One patient, for the front desk, read on the server with the staff member's session. null
// when there is no such patient (404, or an id that is not one: 400); other failures throw, as
// in serverApiRequest
export async function getPatient(id: string): Promise<StaffPatient | null> {
  try {
    const { patient } = await serverApiRequest<{ patient: StaffPatient }>(
      `/patients/${encodeURIComponent(id)}`,
    )
    return patient
  } catch (error) {
    if (error instanceof ApiError && [400, 404].includes(error.status)) return null
    throw error
  }
}
