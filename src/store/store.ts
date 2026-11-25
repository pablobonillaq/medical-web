import { combineSlices, configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware, { type SagaIterator } from 'redux-saga'
import { all, call } from 'redux-saga/effects'
import { apiHealthSaga } from './api-health-saga'
import { apiStatusSlice } from './api-status-slice'
import { sessionExpirySaga } from './session-expiry-saga'
import { sessionExpirySlice } from './session-expiry-slice'
import { sessionSlice } from './session-slice'
import { profileSlice } from './profile-slice'
import { bookingSlice } from './booking-slice'
import { appointmentChangesSlice } from './appointment-changes-slice'
import { rescheduleSlice } from './reschedule-slice'

// Each slice keeps its state under its own name: state.apiStatus, state.session
const rootReducer = combineSlices(
  apiStatusSlice,
  sessionSlice,
  sessionExpirySlice,
  profileSlice,
  bookingSlice,
  appointmentChangesSlice,
  rescheduleSlice,
)

export type RootState = ReturnType<typeof rootReducer>

function* rootSaga(): SagaIterator {
  yield all([call(apiHealthSaga), call(sessionExpirySaga)])
}

// A new store for each visitor: StoreProvider creates one per page load, so on the server a
// store is never shared between requests (see ADR 0003). Tests start from any state they need.
// Thunks come with Redux Toolkit; the saga middleware is added for the long-running flows
export const makeStore = (preloadedState?: Partial<RootState>) => {
  const sagaMiddleware = createSagaMiddleware()
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
  })

  // The sagas are not started here: on the server they would call the API on every render.
  // StoreProvider starts them in the browser, once the page has hydrated
  return Object.assign(store, { runSagas: () => sagaMiddleware.run(rootSaga) })
}

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
