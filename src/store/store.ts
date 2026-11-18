import { combineSlices, configureStore } from '@reduxjs/toolkit'
import { apiStatusSlice } from './api-status-slice'

// Each slice keeps its state under its own name: state.apiStatus
const rootReducer = combineSlices(apiStatusSlice)

export type RootState = ReturnType<typeof rootReducer>

// A new store for each visitor: StoreProvider creates one per page load, so on the server a
// store is never shared between requests (see ADR 0003). Tests start from any state they need
export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({ reducer: rootReducer, preloadedState })

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
