import { cacheLife, cacheTag } from 'next/cache'
import { z } from 'zod'
import { env } from '@/config/env'

// The clinic writes its catalog in Spanish, whatever the language of the page. Pages in other
// languages mark those texts with lang, so screen readers pronounce them in Spanish
export const CATALOG_LANGUAGE = 'es'

// Only what the pages show. Zod drops every other field, which keeps the cache small
const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.number(),
})

export type Service = z.infer<typeof serviceSchema>

const servicesResponseSchema = z.object({ services: z.array(serviceSchema) })

// The API can take this long before the page gives up on it. Without a limit, an API that never
// answers would hang the build
const TIMEOUT_MS = 5_000

// Reads public data from the API, without a cookie: the same for every visitor, so it can be
// cached. null when the API cannot be reached, fails or answers something unexpected
async function fetchPublic<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
  try {
    const response = await fetch(`${env.API_URL.replace(/\/+$/, '')}${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) return null
    const result = schema.safeParse(await response.json())
    return result.success ? result.data : null
  } catch {
    return null
  }
}

// The active services. Cached for every visitor and prerendered with the page. The tag lets the
// admin area refresh them right after a change (revalidateTag('services'))
export async function getServices(): Promise<Service[] | null> {
  'use cache'
  cacheTag('services')

  const data = await fetchPublic('/services', servicesResponseSchema)
  if (!data) {
    // Try again soon. A lifetime this short also keeps the failure out of the build: if the API
    // is down while building, the list renders on each request instead (behind <Suspense>)
    cacheLife('seconds')
    return null
  }

  cacheLife('hours')
  return data.services
}
