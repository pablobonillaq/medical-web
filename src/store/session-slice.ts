import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiError, apiRequest } from '@/api/client'
import type { LoginValues } from '@/auth/login-schema'
import type { RegisterValues } from '@/auth/register-schema'
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

// Why a sign-up failed, as the form explains it (register.errors in the dictionary)
export type SignUpError = 'emailTaken' | 'invalidData' | 'tooManyAttempts' | 'network' | 'unknown'

// The answers of POST /auth/register: 409 the email has an account, 400 data the API did not
// accept, 429 too many accounts from the same network (rate limit), 0 no answer at all
const SIGN_UP_ERRORS: Record<number, SignUpError> = {
  0: 'network',
  400: 'invalidData',
  409: 'emailTaken',
  429: 'tooManyAttempts',
}

export const signUpErrorFor = (error: unknown): SignUpError =>
  (error instanceof ApiError && SIGN_UP_ERRORS[error.status]) || 'unknown'

// signedIn: the account was created and the session started. created: the account exists, but
// signing in afterwards failed, so the visitor signs in by hand
export type SignUpResult = 'signedIn' | 'created'

// Creates the patient account and signs in with it, so the visitor does not type the password
// twice. The API creates accounts without a session, hence the second request
export const signUp = createAsyncThunk<SignUpResult, RegisterValues, { rejectValue: SignUpError }>(
  'session/signUp',
  async (values, { dispatch, rejectWithValue }) => {
    try {
      await apiRequest('/auth/register', { method: 'POST', body: values })
    } catch (error) {
      return rejectWithValue(signUpErrorFor(error))
    }

    const signedIn = await dispatch(signIn({ email: values.email, password: values.password }))
    return signIn.fulfilled.match(signedIn) ? 'signedIn' : 'created'
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
  signingUp: boolean
  signUpError: SignUpError | null
}

const initialState: SessionState = {
  user: null,
  signingIn: false,
  signInError: null,
  signingOut: false,
  signingUp: false,
  signUpError: null,
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
      .addCase(signUp.pending, (state) => {
        state.signingUp = true
        state.signUpError = null
      })
      .addCase(signUp.fulfilled, (state) => {
        state.signingUp = false
      })
      .addCase(signUp.rejected, (state, action) => {
        state.signingUp = false
        // No payload only if the request was aborted before it ended
        state.signUpError = action.payload ?? 'unknown'
      })
  },
  selectors: {
    selectSessionUser: (state) => state.user,
    selectSigningIn: (state) => state.signingIn,
    selectSignInError: (state) => state.signInError,
    selectSigningOut: (state) => state.signingOut,
    selectSigningUp: (state) => state.signingUp,
    selectSignUpError: (state) => state.signUpError,
  },
})

export const {
  selectSessionUser,
  selectSigningIn,
  selectSignInError,
  selectSigningOut,
  selectSigningUp,
  selectSignUpError,
} = sessionSlice.selectors
