// Every request goes to /api on the same origin, and Next.js forwards it to the Express API
// (see src/config/rewrites.ts). Same origin, so the session cookie travels with no CORS
const API_PREFIX = '/api'

// The body of an error from the Express API: { error: 'Invalid request data', details: {...} }
type ApiErrorBody = {
  error?: string
  details?: unknown
}

// A request that failed. status 0 means the API could not be reached at all
export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  // Sent as JSON
  body?: unknown
}

// fetch for the API: sends and reads JSON, and turns every failure into an ApiError. Runs in
// the browser (Client Components and the store), so the URL is relative to the page
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...init } = options
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(new URL(`${API_PREFIX}${path}`, window.location.origin), {
      ...init,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'The API could not be reached')
  }

  // 204 No Content, or a body that is not JSON (an HTML error page from a proxy)
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
