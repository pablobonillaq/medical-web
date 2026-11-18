import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { apiRequest } from '@/api/client'

// What GET /health of the Express API answers
type HealthResponse = {
  status: 'ok' | 'error'
  database: 'up' | 'down'
}

// unknown: not checked yet. A new check keeps the last known status, so the page does not
// flicker between "online" and "checking"
export type ApiStatus = 'unknown' | 'online' | 'offline'
export type CheckedApiStatus = Exclude<ApiStatus, 'unknown'>

type ApiStatusState = {
  status: ApiStatus
  // A check asked for by the visitor ("Try again") is running
  checking: boolean
}

const initialState: ApiStatusState = { status: 'unknown', checking: false }

// Asks the API whether it and its database answer. Never fails: an error of the API, or no
// answer at all, means offline. Used by the saga and by the thunk
export const fetchApiStatus = async (): Promise<CheckedApiStatus> => {
  try {
    const health = await apiRequest<HealthResponse>('/health')
    return health.status === 'ok' ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}

// A request and its answer, asked for by the visitor: a thunk (see ADR 0003)
export const checkApiHealth = createAsyncThunk('apiStatus/check', fetchApiStatus)

export const apiStatusSlice = createSlice({
  name: 'apiStatus',
  initialState,
  reducers: {
    // A check made by the saga that watches the API
    statusChecked: (state, action: PayloadAction<CheckedApiStatus>) => {
      state.status = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkApiHealth.pending, (state) => {
        state.checking = true
      })
      .addCase(checkApiHealth.fulfilled, (state, action) => {
        state.checking = false
        state.status = action.payload
      })
  },
  selectors: {
    selectApiStatus: (state) => state.status,
    selectApiChecking: (state) => state.checking,
  },
})

export const { statusChecked } = apiStatusSlice.actions
export const { selectApiStatus, selectApiChecking } = apiStatusSlice.selectors
