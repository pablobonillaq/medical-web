import { channel } from 'redux-saga'
import { delay } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { dynamic } from 'redux-saga-test-plan/providers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  apiHealthSaga,
  createVisibilityChannel,
  isPageHidden,
  nextCheckDelay,
} from './api-health-saga'
import { fetchApiStatus, statusChecked, type CheckedApiStatus } from './api-status-slice'

// delay(ms) is a call to an internal function of redux-saga: this is that function
const delayFn = delay(0).payload.fn

// Gives back the values in order, and then the last one again and again
const inOrder = <T>(...values: T[]) => {
  let index = 0
  return dynamic(() => values[Math.min(index++, values.length - 1)])
}

// Records how long the saga waits. The first waits end at once; the next one never ends,
// which stops the loop
const waits = (record: number[], endAtOnce: number) =>
  dynamic(({ args: [ms] }: { args: [number] }) => {
    record.push(ms)
    return record.length <= endAtOnce ? undefined : new Promise(() => {})
  })

// The saga with the API and the page faked: no network, no real timers, no real document
const runSaga = ({
  statuses,
  delays,
  endAtOnce,
  hidden = [false],
  visibility = channel<boolean>(),
}: {
  statuses: CheckedApiStatus[]
  delays: number[]
  endAtOnce: number
  hidden?: boolean[]
  visibility?: ReturnType<typeof channel<boolean>>
}) =>
  expectSaga(apiHealthSaga).provide([
    [matchers.call.fn(createVisibilityChannel), visibility],
    [matchers.call.fn(fetchApiStatus), inOrder(...statuses)],
    [matchers.call.fn(delayFn), waits(delays, endAtOnce)],
    [matchers.call.fn(isPageHidden), inOrder(...hidden)],
  ])

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  // Back to the visibilityState of jsdom
  Reflect.deleteProperty(document, 'visibilityState')
})

describe('nextCheckDelay', () => {
  it('is a minute while the API answers', () => {
    expect(nextCheckDelay(0)).toBe(60_000)
  })

  it('doubles after each failure, from 15 seconds up to 5 minutes', () => {
    expect([1, 2, 3, 4, 5, 6, 20].map(nextCheckDelay)).toEqual([
      15_000, 30_000, 60_000, 120_000, 240_000, 300_000, 300_000,
    ])
  })
})

describe('apiHealthSaga', () => {
  it('checks at once, records the status and checks again a minute later', async () => {
    const delays: number[] = []

    await runSaga({ statuses: ['online'], delays, endAtOnce: 0 })
      .put(statusChecked('online'))
      .silentRun(50)

    expect(delays).toEqual([60_000])
  })

  it('waits longer after each failure', async () => {
    const delays: number[] = []

    await runSaga({ statuses: ['offline'], delays, endAtOnce: 3 })
      .put(statusChecked('offline'))
      .silentRun(50)

    expect(delays).toEqual([15_000, 30_000, 60_000, 120_000])
  })

  it('goes back to once a minute when the API answers again', async () => {
    const delays: number[] = []

    await runSaga({ statuses: ['offline', 'online'], delays, endAtOnce: 1 })
      .put(statusChecked('offline'))
      .put(statusChecked('online'))
      .silentRun(50)

    expect(delays).toEqual([15_000, 60_000])
  })

  it('waits while the page is hidden and checks as soon as it is visible', async () => {
    const delays: number[] = []
    const visibility = channel<boolean>()
    setTimeout(() => visibility.put(true), 20)

    await runSaga({ statuses: ['online'], delays, endAtOnce: 1, hidden: [true, false], visibility })
      .take(visibility)
      .silentRun(80)

    // The second check, and the wait after it, came after the page was visible again
    expect(delays).toEqual([60_000, 60_000])
  })

  it('closes the visibility channel when it is cancelled', async () => {
    const visibility = channel<boolean>()
    const close = vi.spyOn(visibility, 'close')

    await runSaga({ statuses: ['online'], delays: [], endAtOnce: 0, visibility }).silentRun(20)

    expect(close).toHaveBeenCalled()
  })
})

describe('the page visibility', () => {
  it('says whether the page is hidden', () => {
    setVisibility('hidden')
    expect(isPageHidden()).toBe(true)

    setVisibility('visible')
    expect(isPageHidden()).toBe(false)
  })

  it('is a channel that tells when the page becomes visible, until it is closed', () => {
    const removeListener = vi.spyOn(document, 'removeEventListener')
    const visibility = createVisibilityChannel()
    const seen: boolean[] = []

    visibility.take((visible) => seen.push(visible as boolean))
    setVisibility('hidden')
    visibility.take((visible) => seen.push(visible as boolean))
    setVisibility('visible')
    visibility.close()

    expect(seen).toEqual([false, true])
    expect(removeListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })
})
