import { cookies, headers } from 'next/headers'
import { SESSION_COOKIE } from '@/auth/constants'
import { env } from '@/config/env'
import { ApiError } from './client'

// The body of an error from the Express API: { error: 'Invalid request data', details: {...} }
type ApiErrorBody = {
  error?: string
  details?: unknown
}

// fetch for Server Components: asks the API (API_URL, not /api) on behalf of the visitor, with
// their session cookie and their address. The answer belongs to one person, so it is never
// cached, and next/headers makes it server-only. Every failure is an ApiError, as in the browser
export async function serverApiRequest<T>(path: string): Promise<T> {
  const requestHeaders = new Headers({ Accept: 'application/json' })
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (token) requestHeaders.set('Cookie', `${SESSION_COOKIE}=${token}`)
  // The rate limits of the API count requests by the visitor's address, not by this server's
  const forwardedFor = (await headers()).get('x-forwarded-for')
  if (forwardedFor) requestHeaders.set('X-Forwarded-For', forwardedFor)

  let response: Response
  try {
    response = await fetch(`${env.API_URL.replace(/\/+$/, '')}${path}`, {
      headers: requestHeaders,
    })
  } catch {
    throw new ApiError(0, 'The API could not be reached')
  }

  const data: unknown = await response.json().catch(() => undefined)

  if (!response.ok) {
    const { error, details } = (data ?? {}) as ApiErrorBody
    throw new ApiError(
      response.status,
      error ?? `Request failed with status ${response.status}`,
      details,
    )
  }

  return data as T
}
