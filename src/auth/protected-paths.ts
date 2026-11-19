// The pages that need a session, as paths after the language: /es/account is "/account".
// The Proxy uses this list for a quick check; each page checks the session again on the server
export const PROTECTED_PATHS = ['/account']

export const isProtectedPath = (path: string) =>
  PROTECTED_PATHS.some(
    (protectedPath) => path === protectedPath || path.startsWith(`${protectedPath}/`),
  )
