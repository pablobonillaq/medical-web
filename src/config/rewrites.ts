// The browser only talks to this app: /api/... is forwarded to the Express API by the Next.js
// server. Both share one origin, so no CORS is needed and the session cookie works as is.
export const apiRewrites = (apiUrl: string) => [
  { source: '/api/:path*', destination: `${apiUrl.replace(/\/+$/, '')}/:path*` },
]