import { delay } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { dynamic } from 'redux-saga-test-plan/providers'
import { describe, expect, it } from 'vitest'
import { now, sessionExpirySaga, watchSession, WARNING_BEFORE_MS } from './session-expiry-saga'
import { expiryWarned, sessionEnded, sessionExpired, sessionStarted } from './session-expiry-slice'

// delay(ms) is a call to an internal function of redux-saga: this is that function
const delayFn = delay(0).payload.fn

const endsAt = Date.UTC(2026, 10, 19, 18, 0, 0)
const expiresAt = new Date(endsAt).toISOString()
const MINUTE = 60_000

// The clock reads these times, one per call
const clock = (...times: number[]) => {
  let index = 0
  return dynamic(() => times[Math.min(index++, times.length - 1)])
}

// Records how long the saga waits; every wait ends at once
const waits = (record: number[]) =>
  dynamic(({ args: [ms] }: { args: [number] }) => {
    record.push(ms)
  })

describe('watchSession', () => {
  it('warns two minutes before the end, and then ends the session', async () => {
    const delays: number[] = []

    await expectSaga(watchSession, expiresAt)
      .provide([
        // An hour before the end, and then two minutes before it
        [matchers.call.fn(now), clock(endsAt - 60 * MINUTE, endsAt - WARNING_BEFORE_MS)],
        [matchers.call.fn(delayFn), waits(delays)],
      ])
      .put(expiryWarned())
      .put(sessionExpired())
      .run()

    expect(delays).toEqual([58 * MINUTE, 2 * MINUTE])
  })

  it('warns at once when the page loads less than two minutes before the end', async () => {
    const delays: number[] = []

    await expectSaga(watchSession, expiresAt)
      .provide([
        [matchers.call.fn(now), clock(endsAt - MINUTE)],
        [matchers.call.fn(delayFn), waits(delays)],
      ])
      .put(expiryWarned())
      .put(sessionExpired())
      .run()

    expect(delays).toEqual([MINUTE])
  })

  it('ends at once a session that is already over', async () => {
    const delays: number[] = []

    await expectSaga(watchSession, expiresAt)
      .provide([
        [matchers.call.fn(now), clock(endsAt + MINUTE)],
        [matchers.call.fn(delayFn), waits(delays)],
      ])
      .put(sessionExpired())
      .run()

    expect(delays).toEqual([])
  })
})

describe('sessionExpirySaga', () => {
  it('counts down when a session starts', async () => {
    await expectSaga(sessionExpirySaga)
      .provide([
        [matchers.call.fn(now), clock(endsAt - 60 * MINUTE, endsAt)],
        [matchers.call.fn(delayFn), waits([])],
      ])
      .dispatch(sessionStarted({ expiresAt }))
      .put(expiryWarned())
      .put(sessionExpired())
      .silentRun(50)
  })

  it('stops counting down when the session ends', async () => {
    await expectSaga(sessionExpirySaga)
      .provide([
        [matchers.call.fn(now), clock(endsAt - 60 * MINUTE)],
        // Each wait takes 20 ms: without the cancel, the warning would come within the run
        [
          matchers.call.fn(delayFn),
          dynamic(() => new Promise((resolve) => setTimeout(resolve, 20))),
        ],
      ])
      .dispatch(sessionStarted({ expiresAt }))
      .dispatch(sessionEnded())
      .not.put(expiryWarned())
      .silentRun(80)
  })
})
