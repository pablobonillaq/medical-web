import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { env } from '@/config/env'
import { readTokenExpiry } from './token'
import type { Role, Session } from './types'

// The httpOnly cookie the API sets at sign-in. The browser sends it to /api/* (same origin),
// and the Next.js server reads it here
export const SESSION_COOKIE = 'access_token'

type MeResponse = {
  user: { id: string; email: string; role: Role }
}

// The Data Access Layer for the session: the one place that reads it on the server. It asks
// the API who the cookie belongs to, so a forged or revoked token counts as signed out.
// next/headers makes it server-only: importing it into a Client Component fails the build.
// cache() reads the session once per request, however many components ask for it
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null

  const expiresAt = readTokenExpiry(token)
  if (!expiresAt) return null

  const requestHeaders = new Headers({
    Accept: 'application/json',
    Cookie: `${SESSION_COOKIE}=${token}`,
  })
  // The rate limits of the API count requests by the visitor's address, not by this server's
  const forwardedFor = (await headers()).get('x-forwarded-for')
  if (forwardedFor) requestHeaders.set('X-Forwarded-For', forwardedFor)

  let response: Response
  try {
    response = await fetch(`${env.API_URL.replace(/\/+$/, '')}/auth/me`, {
      headers: requestHeaders,
    })
  } catch {
    // The API is down: nobody can be signed in
    return null
  }
  if (!response.ok) return null

  const { user } = (await response.json()) as MeResponse
  return {
    user: { id: user.id, email: user.email, role: user.role },
    expiresAt: expiresAt.toISOString(),
  }
})
