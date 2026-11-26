import { serverApiRequest } from '@/api/server'
import type { PatientPage } from './types'

type PatientSearch = {
  // A name, or at least 4 digits of the phone; without it, every patient
  search?: string
  page: number
  pageSize: number
}

// One page of the clinic's patients, for the front desk, read on the server with the staff
// member's session. Throws an ApiError if the API cannot give it (see serverApiRequest)
export async function searchPatients({
  search,
  page,
  pageSize,
}: PatientSearch): Promise<PatientPage> {
  const query = new URLSearchParams({
    ...(search && { search }),
    page: String(page),
    pageSize: String(pageSize),
  })
  return serverApiRequest<PatientPage>(`/patients?${query}`)
}
