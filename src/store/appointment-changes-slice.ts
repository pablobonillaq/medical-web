import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiError, apiRequest } from '@/api/client'
import type { Appointment } from '@/appointments/types'

// Why a change failed, as the page explains it (appointmentPage.errors in the dictionary)
export type ChangeError = 'notAllowed' | 'alreadyChanged' | 'network' | 'unknown'

// The answers of the API: 400 too late (less than 2 hours left, or already started), 409 the
// appointment changed in the meantime (cancelled elsewhere, already confirmed), 0 no answer
const CHANGE_ERRORS: Record<number, ChangeError> = {
  0: 'network',
  400: 'notAllowed',
  409: 'alreadyChanged',
}

export const changeErrorFor = (error: unknown): ChangeError =>
  (error instanceof ApiError && CHANGE_ERRORS[error.status]) || 'unknown'

type AppointmentResponse = { appointment: Appointment }

// The patient says they will come: scheduled → confirmed
export const confirmAppointment = createAsyncThunk<
  Appointment,
  string,
  { rejectValue: ChangeError }
>('appointmentChanges/confirm', async (id, { rejectWithValue }) => {
  try {
    const { appointment } = await apiRequest<AppointmentResponse>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: { status: 'confirmed' },
    })
    return appointment
  } catch (error) {
    return rejectWithValue(changeErrorFor(error))
  }
})

// Appointments are never deleted: cancelling keeps it, with the reason if there is one
export const cancelAppointment = createAsyncThunk<
  Appointment,
  { id: string; reason?: string },
  { rejectValue: ChangeError }
>('appointmentChanges/cancel', async ({ id, reason }, { rejectWithValue }) => {
  try {
    const { appointment } = await apiRequest<AppointmentResponse>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: reason ? { reason } : {},
    })
    return appointment
  } catch (error) {
    return rejectWithValue(changeErrorFor(error))
  }
})

type AppointmentChangesState = {
  changing: boolean
  changeError: ChangeError | null
}

const initialState: AppointmentChangesState = { changing: false, changeError: null }

// One change at a time, confirming or cancelling: the page shows one appointment
export const appointmentChangesSlice = createSlice({
  name: 'appointmentChanges',
  initialState,
  reducers: {
    // A new attempt starts without the last error, e.g. when the cancel dialog opens again
    changeErrorCleared: (state) => {
      state.changeError = null
    },
  },
  extraReducers: (builder) => {
    for (const thunk of [confirmAppointment, cancelAppointment]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.changing = true
          state.changeError = null
        })
        .addCase(thunk.fulfilled, (state) => {
          state.changing = false
        })
        .addCase(thunk.rejected, (state, action) => {
          state.changing = false
          // No payload only if the request was aborted before it ended
          state.changeError = action.payload ?? 'unknown'
        })
    }
  },
  selectors: {
    selectChanging: (state) => state.changing,
    selectChangeError: (state) => state.changeError,
  },
})

export const { changeErrorCleared } = appointmentChangesSlice.actions
export const { selectChanging, selectChangeError } = appointmentChangesSlice.selectors
