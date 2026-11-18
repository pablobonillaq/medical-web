import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiError, apiRequest } from '@/api/client'
import type { LoginValues } from '@/auth/login-schema'
import type { SessionUser } from '@/auth/types'

// Why a sign-in failed, as the form explains it (login.errors in the dictionary)
export type SignInError =
  'invalidCredentials' | 'disabled' | 'tooManyAttempts' | 'network' | 'unknown'

// The answers of POST /auth/login: 401 wrong email or password, 403 disabled account, 429 too
// many failed attempts (rate limit), 0 no answer at all
const SIGN_IN_ERRORS: Record<number, SignInError> = {
  0: 'network',
  401: 'invalidCredentials',
  403: 'disabled',
  429: 'tooManyAttempts',
}

export const signInErrorFor = (error: unknown): SignInError =>
  (error instanceof ApiError && SIGN_IN_ERRORS[error.status]) || 'unknown'

type LoginResponse = {
  user: SessionUser
}

// A request and its answer: a thunk (see ADR 0003). The API answers with the user and sets the
// httpOnly session cookie, which JavaScript never sees
export const signIn = createAsyncThunk<SessionUser, LoginValues, { rejectValue: SignInError }>(
  'session/signIn',
  async (credentials, { rejectWithValue }) => {
    try {
      const { user } = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: credentials,
      })
      return { id: user.id, email: user.email, role: user.role }
    } catch (error) {
      return rejectWithValue(signInErrorFor(error))
    }
  },
)

// The API clears its session cookie and answers 204
export const signOut = createAsyncThunk('session/signOut', () =>
  apiRequest<undefined>('/auth/logout', { method: 'POST' }),
)

type SessionState = {
  user: SessionUser | null
  signingIn: boolean
  signInError: SignInError | null
  signingOut: boolean
}

const initialState: SessionState = {
  user: null,
  signingIn: false,
  signInError: null,
  signingOut: false,
}

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.signingIn = true
        state.signInError = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.signingIn = false
        state.user = action.payload
      })
      .addCase(signIn.rejected, (state, action) => {
        state.signingIn = false
        // No payload only if the request was aborted before it ended
        state.signInError = action.payload ?? 'unknown'
      })
      .addCase(signOut.pending, (state) => {
        state.signingOut = true
      })
      .addCase(signOut.fulfilled, (state) => {
        state.signingOut = false
        state.user = null
      })
      .addCase(signOut.rejected, (state) => {
        // The cookie is still there: the visitor is still signed in
        state.signingOut = false
      })
  },
  selectors: {
    selectSessionUser: (state) => state.user,
    selectSigningIn: (state) => state.signingIn,
    selectSignInError: (state) => state.signInError,
    selectSigningOut: (state) => state.signingOut,
  },
})

export const { selectSessionUser, selectSigningIn, selectSignInError, selectSigningOut } =
  sessionSlice.selectors
