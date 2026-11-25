import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiError, apiRequest } from '@/api/client'
import type { Appointment } from '@/appointments/types'

// Why the new time was not saved, as the form explains it (reschedulePage.errors)
export type RescheduleError = 'slotTaken' | 'notAllowed' | 'network' | 'unknown'

// The answers of PATCH /appointments/:id/reschedule: 409 someone took the time first, the patient
// has another appointment then, or the appointment changed (cancelled elsewhere); 400 too late
// (less than 2 hours left) or a time the API does not accept; 0 no answer at all
const RESCHEDULE_ERRORS: Record<number, RescheduleError> = {
  0: 'network',
  400: 'notAllowed',
  409: 'slotTaken',
}

export const rescheduleErrorFor = (error: unknown): RescheduleError =>
  (error instanceof ApiError && RESCHEDULE_ERRORS[error.status]) || 'unknown'

// Same doctor and service, another time. The API sets it back to scheduled: the patient
// confirms the new time again
export const rescheduleAppointment = createAsyncThunk<
  Appointment,
  { id: string; startsAt: string },
  { rejectValue: RescheduleError }
>('reschedule/reschedule', async ({ id, startsAt }, { rejectWithValue }) => {
  try {
    const { appointment } = await apiRequest<{ appointment: Appointment }>(
      `/appointments/${id}/reschedule`,
      { method: 'PATCH', body: { startsAt } },
    )
    return appointment
  } catch (error) {
    return rejectWithValue(rescheduleErrorFor(error))
  }
})

type RescheduleState = {
  rescheduling: boolean
  rescheduleError: RescheduleError | null
}

const initialState: RescheduleState = { rescheduling: false, rescheduleError: null }

export const rescheduleSlice = createSlice({
  name: 'reschedule',
  initialState,
  reducers: {
    // The form starts without the error of an earlier visit
    rescheduleErrorCleared: (state) => {
      state.rescheduleError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(rescheduleAppointment.pending, (state) => {
        state.rescheduling = true
        state.rescheduleError = null
      })
      .addCase(rescheduleAppointment.fulfilled, (state) => {
        state.rescheduling = false
      })
      .addCase(rescheduleAppointment.rejected, (state, action) => {
        state.rescheduling = false
        // No payload only if the request was aborted before it ended
        state.rescheduleError = action.payload ?? 'unknown'
      })
  },
  selectors: {
    selectRescheduling: (state) => state.rescheduling,
    selectRescheduleError: (state) => state.rescheduleError,
  },
})

export const { rescheduleErrorCleared } = rescheduleSlice.actions
export const { selectRescheduling, selectRescheduleError } = rescheduleSlice.selectors
