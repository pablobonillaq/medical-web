// @vitest-environment node
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { config, proxy } from './proxy'

const request = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(new URL(path, 'http://localhost:3001'), { headers })

describe('proxy', () => {
  it("redirects a URL without a language to the browser's, keeping the path and the query", () => {
    const response = proxy(request('/citas?dia=lunes', { 'accept-language': 'en-US,en;q=0.9' }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3001/en/citas?dia=lunes')
  })

  it('redirects the home page to Spanish when nothing else is known', () => {
    const response = proxy(request('/'))

    expect(response.headers.get('location')).toBe('http://localhost:3001/es')
  })

  it('prefers the language used last time over the browser', () => {
    const response = proxy(request('/', { cookie: 'locale=en', 'accept-language': 'es' }))

    expect(response.headers.get('location')).toBe('http://localhost:3001/en')
  })

  it('lets a URL with a language through and remembers that language', () => {
    const response = proxy(request('/en/citas', { cookie: 'locale=es' }))

    expect(response.headers.get('location')).toBeNull()
    expect(response.cookies.get('locale')).toMatchObject({
      value: 'en',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  })

  it('does not set the cookie again when it already has that language', () => {
    const response = proxy(request('/es', { cookie: 'locale=es' }))

    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('treats a path that only starts like a language as a page without one', () => {
    const response = proxy(request('/español'))

    expect(response.headers.get('location')).toBe('http://localhost:3001/es/espa%C3%B1ol')
  })

  it('does not run for the API, Next.js internals or files', () => {
    const [matcher] = config.matcher
    const matches = (path: string) => new RegExp(`^${matcher}$`).test(path)

    expect(matches('/')).toBe(true)
    expect(matches('/citas')).toBe(true)
    expect(matches('/api/auth/login')).toBe(false)
    expect(matches('/_next/static/chunk.js')).toBe(false)
    expect(matches('/favicon.ico')).toBe(false)
  })
})
