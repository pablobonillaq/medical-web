import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiError, apiRequest } from '@/api/client'
import type { ProfileValues } from '@/patients/profile-schema'
import type { Patient } from '@/patients/types'

// Why saving the profile failed, as the form explains it (profilePage.errors in the dictionary)
export type SaveProfileError = 'invalidData' | 'network' | 'unknown'

// The answers of PATCH /patients/:id: 400 data the API did not accept, 0 no answer at all
const SAVE_PROFILE_ERRORS: Record<number, SaveProfileError> = {
  0: 'network',
  400: 'invalidData',
}

export const saveProfileErrorFor = (error: unknown): SaveProfileError =>
  (error instanceof ApiError && SAVE_PROFILE_ERRORS[error.status]) || 'unknown'

type SaveProfileArgs = {
  patientId: string
  values: ProfileValues
}

// A request and its answer: a thunk (see ADR 0003). The page reads the profile on the server;
// after saving, it renders again with router.refresh()
export const saveProfile = createAsyncThunk<
  Patient,
  SaveProfileArgs,
  { rejectValue: SaveProfileError }
>('profile/save', async ({ patientId, values }, { rejectWithValue }) => {
  try {
    const { patient } = await apiRequest<{ patient: Patient }>(`/patients/${patientId}`, {
      method: 'PATCH',
      body: values,
    })
    return patient
  } catch (error) {
    return rejectWithValue(saveProfileErrorFor(error))
  }
})

type ProfileState = {
  saving: boolean
  saveError: SaveProfileError | null
}

const initialState: ProfileState = { saving: false, saveError: null }

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(saveProfile.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(saveProfile.fulfilled, (state) => {
        state.saving = false
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.saving = false
        // No payload only if the request was aborted before it ended
        state.saveError = action.payload ?? 'unknown'
      })
  },
  selectors: {
    selectSavingProfile: (state) => state.saving,
    selectSaveProfileError: (state) => state.saveError,
  },
})

export const { selectSavingProfile, selectSaveProfileError } = profileSlice.selectors
