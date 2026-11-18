// The roles of the Express API (see medical-api, users.schema.ts)
export type Role = 'admin' | 'doctor' | 'employee' | 'patient'

// Only what the pages need to know about who is signed in. The rest of the user record stays
// in the API
export type SessionUser = {
  id: string
  email: string
  role: Role
}

export type Session = {
  user: SessionUser
  // When the session ends (ISO 8601), to warn before it does
  expiresAt: string
}
