import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import { makeStore } from './store'
import { checkApiHealth, selectApiStatus } from './api-status-slice'

// The real store, with the fake API answering
const checkWith = async (answer?: () => Response) => {
  if (answer) server.use(http.get('*/api/health', answer))
  const store = makeStore()
  await store.dispatch(checkApiHealth())
  return selectApiStatus(store.getState())
}

describe('apiStatus', () => {
  it('starts unknown, before the first check', () => {
    expect(selectApiStatus(makeStore().getState())).toBe('unknown')
  })

  it('is online when the API and its database answer', async () => {
    await expect(checkWith()).resolves.toBe('online')
  })

  it('is offline when the API answers that its database is down', async () => {
    await expect(
      checkWith(() => HttpResponse.json({ status: 'error', database: 'down' }, { status: 503 })),
    ).resolves.toBe('offline')
  })

  it('is offline when the answer does not say ok', async () => {
    await expect(checkWith(() => HttpResponse.json({ status: 'error' }))).resolves.toBe('offline')
  })

  it('is offline when the API cannot be reached', async () => {
    await expect(checkWith(() => HttpResponse.error())).resolves.toBe('offline')
  })

  it('keeps the last known status while a new check runs', async () => {
    const store = makeStore({ apiStatus: { status: 'online' } })

    const check = store.dispatch(checkApiHealth())
    expect(selectApiStatus(store.getState())).toBe('online')
    await check
  })
})
