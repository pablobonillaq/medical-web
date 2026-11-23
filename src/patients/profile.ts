import { serverApiRequest } from '@/api/server'
import type { Patient } from './types'

// The signed-in patient's own profile, read on the server with their session. Throws an
// ApiError if the API cannot give it (see serverApiRequest)
export async function getMyProfile(): Promise<Patient> {
  const { patient } = await serverApiRequest<{ patient: Patient }>('/patients/me')
  return patient
}
