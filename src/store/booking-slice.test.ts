import { testAppointment } from '@mocks/appointments'
import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import {
  bookAppointment,
  selectBookError,
  selectBooking,
  type BookingValues,
} from './booking-slice'
import { makeStore } from './store'

const values: BookingValues = {
  doctorId: testAppointment.doctor.id,
  serviceId: testAppointment.service.id,
  startsAt: testAppointment.startsAt,
  notes: 'Dolor abdominal',
}

describe('bookAppointment', () => {
  it('books the time and returns the new appointment', async () => {
    let sent: unknown
    server.use(
      http.post('*/api/appointments', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ appointment: testAppointment }, { status: 201 })
      }),
    )
    const store = makeStore()

    const pending = store.dispatch(bookAppointment(values))
    expect(selectBooking(store.getState())).toBe(true)
    const result = await pending

    expect(sent).toEqual(values)
    expect(result.payload).toEqual(testAppointment)
    expect(selectBooking(store.getState())).toBe(false)
    expect(selectBookError(store.getState())).toBeNull()
  })

  it.each([
    [409, 'slotTaken'],
    [400, 'invalidData'],
    [500, 'unknown'],
  ] as const)('explains an answer %i as %s', async (status, reason) => {
    server.use(http.post('*/api/appointments', () => HttpResponse.json({}, { status })))
    const store = makeStore()

    await store.dispatch(bookAppointment(values))

    expect(selectBookError(store.getState())).toBe(reason)
    expect(selectBooking(store.getState())).toBe(false)
  })

  it('says so when the API cannot be reached', async () => {
    server.use(http.post('*/api/appointments', () => HttpResponse.error()))
    const store = makeStore()

    await store.dispatch(bookAppointment(values))

    expect(selectBookError(store.getState())).toBe('network')
  })

  it('counts a booking that ended without an answer as unknown', () => {
    const store = makeStore()

    store.dispatch(bookAppointment.rejected(new Error('Aborted'), 'request-id', values))

    expect(selectBookError(store.getState())).toBe('unknown')
  })
})
