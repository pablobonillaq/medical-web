import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiRequest } from '@/api/client'

// What GET /health of the Express API answers
type HealthResponse = {
  status: 'ok' | 'error'
  database: 'up' | 'down'
}

// unknown: not checked yet. A new check keeps the last known status, so the page does not
// flicker between "online" and "checking"
export type ApiStatus = 'unknown' | 'online' | 'offline'

type ApiStatusState = {
  status: ApiStatus
}

const initialState: ApiStatusState = { status: 'unknown' }

// A request and its answer: a thunk (see ADR 0003). An error of the API, or no answer at all,
// rejects the thunk, and the slice records it as offline
export const checkApiHealth = createAsyncThunk('apiStatus/check', () =>
  apiRequest<HealthResponse>('/health'),
)

export const apiStatusSlice = createSlice({
  name: 'apiStatus',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkApiHealth.fulfilled, (state, action) => {
        state.status = action.payload.status === 'ok' ? 'online' : 'offline'
      })
      .addCase(checkApiHealth.rejected, (state) => {
        state.status = 'offline'
      })
  },
  selectors: {
    selectApiStatus: (state) => state.status,
  },
})

export const { selectApiStatus } = apiStatusSlice.selectors
