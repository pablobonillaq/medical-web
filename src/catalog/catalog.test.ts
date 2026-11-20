import { testServices } from '@mocks/catalog'
import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { cacheLife, cacheTag } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getServices } from './catalog'

// The cache only exists inside Next.js: here the test checks how long each answer would be kept
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

beforeEach(() => {
  vi.mocked(cacheLife).mockClear()
  vi.mocked(cacheTag).mockClear()
})

describe('getServices', () => {
  it('returns the services with only the fields the pages show, cached for hours', async () => {
    const services = await getServices()

    expect(services).toEqual([
      {
        id: testServices[0].id,
        name: 'Consulta general',
        description: 'Valoración médica de primera vez o de seguimiento.',
        durationMinutes: 30,
      },
      { id: testServices[1].id, name: 'Ultrasonido', description: null, durationMinutes: 45 },
    ])
    expect(cacheTag).toHaveBeenCalledWith('services')
    expect(cacheLife).toHaveBeenCalledWith('hours')
  })

  it('reads the catalog without a session cookie, the same for every visitor', async () => {
    let cookie: string | null = 'not read'
    server.use(
      http.get('*/services', ({ request }) => {
        cookie = request.headers.get('cookie')
        return HttpResponse.json({ services: [] })
      }),
    )

    await getServices()

    expect(cookie).toBeNull()
  })

  it.each([
    ['the API fails', () => HttpResponse.json({ error: 'Internal error' }, { status: 500 })],
    ['the API cannot be reached', () => HttpResponse.error()],
    ['the API answers something unexpected', () => HttpResponse.json({ services: 'none' })],
  ])('returns null and tries again soon when %s', async (_case, answer) => {
    server.use(http.get('*/services', answer))

    expect(await getServices()).toBeNull()
    expect(cacheLife).toHaveBeenCalledWith('seconds')
    expect(cacheLife).not.toHaveBeenCalledWith('hours')
  })
})
