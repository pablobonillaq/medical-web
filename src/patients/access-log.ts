import { serverApiRequest } from '@/api/server'
import type { AccessLogPage } from './types'

// One page of who opened the signed-in patient's record, the latest first, read on the server
// with their session. The patient's own visits are left out by the API. Throws an ApiError if
// the API cannot give it (see serverApiRequest)
export async function getMyAccessLog({
  page,
  pageSize,
}: {
  page: number
  pageSize: number
}): Promise<AccessLogPage> {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return serverApiRequest<AccessLogPage>(`/patients/me/access-log?${query}`)
}
