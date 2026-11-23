import { cookies } from 'next/headers'
import { cache } from 'react'
import { serverApiRequest } from '@/api/server'
import { SESSION_COOKIE } from './constants'
import { readTokenExpiry } from './token'
import type { Role, Session } from './types'

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

  try {
    const { user } = await serverApiRequest<MeResponse>('/auth/me')
    return {
      user: { id: user.id, email: user.email, role: user.role },
      expiresAt: expiresAt.toISOString(),
    }
  } catch {
    // The API rejected the token, or is down: nobody can be signed in
    return null
  }
})
