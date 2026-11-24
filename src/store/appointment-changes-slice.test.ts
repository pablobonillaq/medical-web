import { testAppointment } from '@mocks/appointments'
import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import {
  cancelAppointment,
  changeErrorCleared,
  confirmAppointment,
  selectChangeError,
  selectChanging,
} from './appointment-changes-slice'
import { makeStore } from './store'

const { id } = testAppointment

describe('confirmAppointment', () => {
  it('confirms the appointment', async () => {
    let sent: { url: string; body: unknown } | undefined
    server.use(
      http.patch('*/api/appointments/:id/status', async ({ request }) => {
        sent = { url: new URL(request.url).pathname, body: await request.json() }
        return HttpResponse.json({ appointment: { ...testAppointment, status: 'confirmed' } })
      }),
    )
    const store = makeStore()

    const pending = store.dispatch(confirmAppointment(id))
    expect(selectChanging(store.getState())).toBe(true)
    const result = await pending

    expect(sent).toEqual({ url: `/api/appointments/${id}/status`, body: { status: 'confirmed' } })
    expect(result.payload).toMatchObject({ status: 'confirmed' })
    expect(selectChanging(store.getState())).toBe(false)
  })

  it.each([
    [400, 'notAllowed'],
    [409, 'alreadyChanged'],
    [500, 'unknown'],
  ] as const)('explains an answer %i as %s', async (status, reason) => {
    server.use(http.patch('*/api/appointments/:id/status', () => HttpResponse.json({}, { status })))
    const store = makeStore()

    await store.dispatch(confirmAppointment(id))

    expect(selectChangeError(store.getState())).toBe(reason)
  })
})

describe('cancelAppointment', () => {
  const cancelling = async (reason?: string) => {
    let body: unknown
    server.use(
      http.patch('*/api/appointments/:id/cancel', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ appointment: { ...testAppointment, status: 'cancelled' } })
      }),
    )
    await makeStore().dispatch(cancelAppointment({ id, reason }))
    return body
  }

  it('cancels with the reason, or without one', async () => {
    expect(await cancelling('Viaje de trabajo')).toEqual({ reason: 'Viaje de trabajo' })
    expect(await cancelling()).toEqual({})
  })

  it('says so when the API cannot be reached, and forgets it on request', async () => {
    server.use(http.patch('*/api/appointments/:id/cancel', () => HttpResponse.error()))
    const store = makeStore()

    await store.dispatch(cancelAppointment({ id }))
    expect(selectChangeError(store.getState())).toBe('network')

    store.dispatch(changeErrorCleared())
    expect(selectChangeError(store.getState())).toBeNull()
  })

  it('counts a change that ended without an answer as unknown', () => {
    const store = makeStore()

    store.dispatch(cancelAppointment.rejected(new Error('Aborted'), 'request-id', { id }))

    expect(selectChangeError(store.getState())).toBe('unknown')
  })
})
