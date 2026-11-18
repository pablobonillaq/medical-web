import { eventChannel, type EventChannel, type SagaIterator } from 'redux-saga'
import { call, delay, put, take } from 'redux-saga/effects'
import { fetchApiStatus, statusChecked, type CheckedApiStatus } from './api-status-slice'

export const CHECK_INTERVAL_MS = 60_000
export const FIRST_RETRY_MS = 15_000
export const MAX_RETRY_MS = 5 * 60_000

// Every minute while the API answers. After a failure, sooner, and then twice as long after
// each new failure (15 s, 30 s, 1 min…) up to 5 minutes, so a down API is not flooded
export const nextCheckDelay = (failures: number) =>
  failures === 0 ? CHECK_INTERVAL_MS : Math.min(FIRST_RETRY_MS * 2 ** (failures - 1), MAX_RETRY_MS)

export const isPageHidden = () => document.visibilityState === 'hidden'

// The visibilitychange events of the page as a channel the saga can wait on: true when the
// page becomes visible. Closing the channel removes the listener
export const createVisibilityChannel = (): EventChannel<boolean> =>
  eventChannel((emit) => {
    const onChange = () => emit(!isPageHidden())
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  })

// Watches the API for as long as the page is open: a long-running flow, so a saga (see
// ADR 0003). It runs in the browser only, started by StoreProvider
export function* apiHealthSaga(): SagaIterator {
  const visibility: EventChannel<boolean> = yield call(createVisibilityChannel)
  try {
    let failures = 0
    while (true) {
      const status: CheckedApiStatus = yield call(fetchApiStatus)
      yield put(statusChecked(status))
      failures = status === 'online' ? 0 : failures + 1

      yield delay(nextCheckDelay(failures))
      // No checks while the tab is hidden: wait until it is visible again, then check at once
      while (yield call(isPageHidden)) yield take(visibility)
    }
  } finally {
    // The saga is cancelled when the page goes away
    visibility.close()
  }
}
