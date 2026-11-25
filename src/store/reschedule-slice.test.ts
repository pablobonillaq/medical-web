import { testAppointment } from '@mocks/appointments'
import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import {
  rescheduleAppointment,
  rescheduleErrorCleared,
  selectRescheduleError,
  selectRescheduling,
} from './reschedule-slice'
import { makeStore } from './store'

const { id } = testAppointment
const startsAt = '2026-11-27T16:00:00.000Z'

describe('rescheduleAppointment', () => {
  it('moves the appointment to the new time', async () => {
    let sent: { url: string; body: unknown } | undefined
    server.use(
      http.patch('*/api/appointments/:id/reschedule', async ({ request }) => {
        sent = { url: new URL(request.url).pathname, body: await request.json() }
        return HttpResponse.json({ appointment: { ...testAppointment, startsAt } })
      }),
    )
    const store = makeStore()

    const pending = store.dispatch(rescheduleAppointment({ id, startsAt }))
    expect(selectRescheduling(store.getState())).toBe(true)
    const result = await pending

    expect(sent).toEqual({ url: `/api/appointments/${id}/reschedule`, body: { startsAt } })
    expect(result.payload).toMatchObject({ startsAt })
    expect(selectRescheduling(store.getState())).toBe(false)
  })

  it.each([
    [409, 'slotTaken'],
    [400, 'notAllowed'],
    [500, 'unknown'],
  ] as const)('explains an answer %i as %s', async (status, reason) => {
    server.use(
      http.patch('*/api/appointments/:id/reschedule', () => HttpResponse.json({}, { status })),
    )
    const store = makeStore()

    await store.dispatch(rescheduleAppointment({ id, startsAt }))

    expect(selectRescheduleError(store.getState())).toBe(reason)
  })

  it('says so when the API cannot be reached, and forgets it on request', async () => {
    server.use(http.patch('*/api/appointments/:id/reschedule', () => HttpResponse.error()))
    const store = makeStore()

    await store.dispatch(rescheduleAppointment({ id, startsAt }))
    expect(selectRescheduleError(store.getState())).toBe('network')

    store.dispatch(rescheduleErrorCleared())
    expect(selectRescheduleError(store.getState())).toBeNull()
  })

  it('counts a change that ended without an answer as unknown', () => {
    const store = makeStore()

    store.dispatch(
      rescheduleAppointment.rejected(new Error('Aborted'), 'request-id', { id, startsAt }),
    )

    expect(selectRescheduleError(store.getState())).toBe('unknown')
  })
})
