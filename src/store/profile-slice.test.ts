import { testProfile } from '@mocks/patients'
import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import type { ProfileValues } from '@/patients/profile-schema'
import { saveProfile, selectSaveProfileError, selectSavingProfile } from './profile-slice'
import { makeStore } from './store'

// The page runs in jsdom, so the requests go to /api on its origin
const values: ProfileValues = {
  firstName: 'Luz',
  lastName: 'Méndez Ruiz',
  birthDate: '1990-05-21',
  phone: '5512345678',
  contactEmail: null,
  emailRemindersOptIn: true,
  whatsappOptIn: true,
}

describe('saveProfile', () => {
  it('sends the profile to the patient it belongs to and returns the saved one', async () => {
    let sent: { url: string; body: unknown } | undefined
    server.use(
      http.patch('*/api/patients/:id', async ({ request }) => {
        sent = { url: new URL(request.url).pathname, body: await request.json() }
        return HttpResponse.json({ patient: { ...testProfile, lastName: 'Méndez Ruiz' } })
      }),
    )
    const store = makeStore()

    const pending = store.dispatch(saveProfile({ patientId: testProfile.id, values }))
    expect(selectSavingProfile(store.getState())).toBe(true)
    const result = await pending

    expect(sent).toEqual({ url: `/api/patients/${testProfile.id}`, body: values })
    expect(result.payload).toMatchObject({ lastName: 'Méndez Ruiz' })
    expect(selectSavingProfile(store.getState())).toBe(false)
    expect(selectSaveProfileError(store.getState())).toBeNull()
  })

  it.each([
    [400, 'invalidData'],
    [500, 'unknown'],
  ] as const)('explains an answer %i as %s', async (status, reason) => {
    server.use(http.patch('*/api/patients/:id', () => HttpResponse.json({}, { status })))
    const store = makeStore()

    await store.dispatch(saveProfile({ patientId: testProfile.id, values }))

    expect(selectSaveProfileError(store.getState())).toBe(reason)
    expect(selectSavingProfile(store.getState())).toBe(false)
  })

  it('says so when the API cannot be reached', async () => {
    server.use(http.patch('*/api/patients/:id', () => HttpResponse.error()))
    const store = makeStore()

    await store.dispatch(saveProfile({ patientId: testProfile.id, values }))

    expect(selectSaveProfileError(store.getState())).toBe('network')
  })

  it('forgets the last error when saving again', async () => {
    server.use(http.patch('*/api/patients/:id', () => HttpResponse.error()))
    const store = makeStore()
    await store.dispatch(saveProfile({ patientId: testProfile.id, values }))
    server.resetHandlers()

    await store.dispatch(saveProfile({ patientId: testProfile.id, values }))

    expect(selectSaveProfileError(store.getState())).toBeNull()
  })

  it('counts a save that ended without an answer as unknown', () => {
    const store = makeStore()

    store.dispatch(
      saveProfile.rejected(new Error('Aborted'), 'request-id', {
        patientId: testProfile.id,
        values,
      }),
    )

    expect(selectSaveProfileError(store.getState())).toBe('unknown')
  })
})
