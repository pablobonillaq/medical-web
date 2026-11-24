import { testAppointment, testAvailability } from '@mocks/appointments'
import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAppointment, getAvailability } from './server'

// next/headers only works inside a Next.js request: the session cookie is set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))

beforeEach(() => {
  vi.mocked(cookies).mockResolvedValue({
    get: () => ({ name: 'access_token', value: 'token' }),
  } as unknown as Awaited<ReturnType<typeof cookies>>)
  vi.mocked(headers).mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>)
})

const query = { doctorId: 'doctor-1', serviceId: 'service-1', date: '2026-11-26' }

describe('getAvailability', () => {
  it('asks the API for the free times of the doctor, the service and the date', async () => {
    let url: URL | undefined
    server.use(
      http.get('http://localhost:3000/availability', ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(testAvailability)
      }),
    )

    await expect(getAvailability(query)).resolves.toEqual(testAvailability)
    expect(Object.fromEntries(url!.searchParams)).toEqual(query)
  })

  it.each([400, 404])('is null when the API does not accept the question (%i)', async (status) => {
    server.use(http.get('*/availability', () => HttpResponse.json({}, { status })))

    await expect(getAvailability(query)).resolves.toBeNull()
  })

  it('fails when the API fails', async () => {
    server.use(http.get('*/availability', () => HttpResponse.json({}, { status: 500 })))

    await expect(getAvailability(query)).rejects.toMatchObject({ status: 500 })
  })
})

describe('getAppointment', () => {
  it('reads one appointment', async () => {
    await expect(getAppointment(testAppointment.id)).resolves.toEqual(testAppointment)
  })

  it.each([400, 404])("is null for an id that is not one of the patient's (%i)", async (status) => {
    server.use(http.get('*/appointments/:id', () => HttpResponse.json({}, { status })))

    await expect(getAppointment('someone-else')).resolves.toBeNull()
  })

  it('fails when the API cannot be reached', async () => {
    server.use(http.get('*/appointments/:id', () => HttpResponse.error()))

    await expect(getAppointment(testAppointment.id)).rejects.toMatchObject({ status: 0 })
  })
})
