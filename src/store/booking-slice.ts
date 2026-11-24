import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiError, apiRequest } from '@/api/client'
import type { Appointment } from '@/appointments/types'

// Why booking failed, as the form explains it (bookingPage.errors in the dictionary)
export type BookError = 'slotTaken' | 'invalidData' | 'network' | 'unknown'

// The answers of POST /appointments: 409 someone took the time first, or the patient already has
// an appointment then; 400 data the API did not accept; 0 no answer at all
const BOOK_ERRORS: Record<number, BookError> = {
  0: 'network',
  400: 'invalidData',
  409: 'slotTaken',
}

export const bookErrorFor = (error: unknown): BookError =>
  (error instanceof ApiError && BOOK_ERRORS[error.status]) || 'unknown'

export type BookingValues = {
  doctorId: string
  serviceId: string
  startsAt: string
  // Optional: sent only when the patient wrote something
  notes?: string
}

// A request and its answer: a thunk (see ADR 0003). Patients always book for themselves, so no
// patientId is sent
export const bookAppointment = createAsyncThunk<
  Appointment,
  BookingValues,
  { rejectValue: BookError }
>('booking/book', async (values, { rejectWithValue }) => {
  try {
    const { appointment } = await apiRequest<{ appointment: Appointment }>('/appointments', {
      method: 'POST',
      body: values,
    })
    return appointment
  } catch (error) {
    return rejectWithValue(bookErrorFor(error))
  }
})

type BookingState = {
  booking: boolean
  bookError: BookError | null
}

const initialState: BookingState = { booking: false, bookError: null }

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(bookAppointment.pending, (state) => {
        state.booking = true
        state.bookError = null
      })
      .addCase(bookAppointment.fulfilled, (state) => {
        state.booking = false
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.booking = false
        // No payload only if the request was aborted before it ended
        state.bookError = action.payload ?? 'unknown'
      })
  },
  selectors: {
    selectBooking: (state) => state.booking,
    selectBookError: (state) => state.bookError,
  },
})

export const { selectBooking, selectBookError } = bookingSlice.selectors
