import { server } from '@mocks/node'
import { http, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import { makeStore } from './store'
import {
  checkApiHealth,
  fetchApiStatus,
  selectApiChecking,
  selectApiStatus,
  statusChecked,
} from './api-status-slice'

const answer = (response: () => Response) => server.use(http.get('*/api/health', response))

describe('fetchApiStatus', () => {
  it('is online when the API and its database answer', async () => {
    await expect(fetchApiStatus()).resolves.toBe('online')
  })

  it('is offline when the API answers that its database is down', async () => {
    answer(() => HttpResponse.json({ status: 'error', database: 'down' }, { status: 503 }))

    await expect(fetchApiStatus()).resolves.toBe('offline')
  })

  it('is offline when the answer does not say ok', async () => {
    answer(() => HttpResponse.json({ status: 'error' }))

    await expect(fetchApiStatus()).resolves.toBe('offline')
  })

  it('is offline when the API cannot be reached', async () => {
    answer(() => HttpResponse.error())

    await expect(fetchApiStatus()).resolves.toBe('offline')
  })
})

describe('apiStatus', () => {
  it('starts unknown, before the first check', () => {
    const state = makeStore().getState()

    expect(selectApiStatus(state)).toBe('unknown')
    expect(selectApiChecking(state)).toBe(false)
  })

  it('records the checks of the saga', () => {
    const store = makeStore()

    store.dispatch(statusChecked('offline'))

    expect(selectApiStatus(store.getState())).toBe('offline')
  })

  it('marks a check asked for by the visitor while it runs, keeping the last status', async () => {
    const store = makeStore({ apiStatus: { status: 'offline', checking: false } })

    const check = store.dispatch(checkApiHealth())
    expect(selectApiChecking(store.getState())).toBe(true)
    expect(selectApiStatus(store.getState())).toBe('offline')

    await check
    expect(selectApiChecking(store.getState())).toBe(false)
    expect(selectApiStatus(store.getState())).toBe('online')
  })
})
