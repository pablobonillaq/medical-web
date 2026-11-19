// The httpOnly cookie the API sets at sign-in. The browser sends it to /api/* (same origin),
// and the Next.js server reads it
export const SESSION_COOKIE = 'access_token'
