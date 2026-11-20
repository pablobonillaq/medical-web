import type { SagaIterator } from 'redux-saga'
import { call, delay, put, takeLatest } from 'redux-saga/effects'
import { expiryWarned, sessionEnded, sessionExpired, sessionStarted } from './session-expiry-slice'
import { signOut } from './session-slice'

// The warning comes this long before the session ends: time to save and sign in again
// (WCAG 2.2.1 asks to warn before a time limit; at least 20 seconds)
export const WARNING_BEFORE_MS = 2 * 60_000

export const now = () => Date.now()

// Counts down to the end of one session: the warning first, then the end
export function* watchSession(expiresAt: string): SagaIterator {
  const endsAt = Date.parse(expiresAt)

  const untilWarning: number = endsAt - WARNING_BEFORE_MS - (yield call(now))
  if (untilWarning > 0) yield delay(untilWarning)
  yield put(expiryWarned())

  const untilEnd: number = endsAt - (yield call(now))
  if (untilEnd > 0) yield delay(untilEnd)
  yield put(sessionExpired())
}

// A long-running flow, so a saga (see ADR 0003). takeLatest cancels the countdown of the
// previous session when a new one starts, or when the session ends or the visitor signs out
export function* sessionExpirySaga(): SagaIterator {
  yield takeLatest(
    [sessionStarted.type, sessionEnded.type, signOut.fulfilled.type],
    function* onSessionChange(action: { type: string; payload?: { expiresAt: string } }) {
      if (sessionStarted.match(action)) yield call(watchSession, action.payload.expiresAt)
    },
  )
}
