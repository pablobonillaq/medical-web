import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { signOut } from './session-slice'

// none: no session, or plenty of time left. warning: the session ends soon and the dialog is
// open. dismissed: the visitor closed the dialog and keeps working. expired: it ended
export type ExpiryStatus = 'none' | 'warning' | 'dismissed' | 'expired'

type SessionExpiryState = {
  // When the session ends (ISO 8601), from the token, as the server read it
  expiresAt: string | null
  status: ExpiryStatus
}

const initialState: SessionExpiryState = { expiresAt: null, status: 'none' }

export const sessionExpirySlice = createSlice({
  name: 'sessionExpiry',
  initialState,
  reducers: {
    // A page with a session loaded: the saga starts counting down to expiresAt
    sessionStarted: (state, action: PayloadAction<{ expiresAt: string }>) => {
      state.expiresAt = action.payload.expiresAt
      state.status = 'none'
    },
    // The page no longer has a session (signed out, or the session area went away)
    sessionEnded: () => initialState,
    expiryWarned: (state) => {
      state.status = 'warning'
    },
    // Only while the warning is open: closing the dialog because the session ended must not
    // hide that it ended
    warningDismissed: (state) => {
      if (state.status === 'warning') state.status = 'dismissed'
    },
    sessionExpired: (state) => {
      state.status = 'expired'
    },
  },
  extraReducers: (builder) => {
    builder.addCase(signOut.fulfilled, () => initialState)
  },
  selectors: {
    selectExpiresAt: (state) => state.expiresAt,
    selectExpiryStatus: (state) => state.status,
  },
})

export const { sessionStarted, sessionEnded, expiryWarned, warningDismissed, sessionExpired } =
  sessionExpirySlice.actions
export const { selectExpiresAt, selectExpiryStatus } = sessionExpirySlice.selectors
