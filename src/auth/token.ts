// When the session token (a JWT) expires, read from its payload, to warn before the session
// ends. The signature is not checked here: the API checks it on every request, so a token that
// was tampered with gets nowhere
export function readTokenExpiry(token: string): Date | null {
  const [, payload] = token.split('.')
  if (!payload) return null

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: unknown
    }
    return typeof exp === 'number' ? new Date(exp * 1000) : null
  } catch {
    return null
  }
}
