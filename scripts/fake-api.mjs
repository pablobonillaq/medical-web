// A stand-in for the Express API in the end-to-end tests and Lighthouse CI, which run without
// the API and its database. It answers only what the pages ask for today, shaped like the real
// API; anything else is 404. Next.js forwards /api/* to it through API_URL, as it would to the
// real API. The account is fictitious, like the ones in medical-api/requests.http
import { createServer } from 'node:http'

const PORT = Number(process.env.FAKE_API_PORT ?? 3000)
const SESSION_COOKIE = 'access_token'

const patient = {
  id: '7d1f6c2a-4b5e-4f3a-9c8d-1a2b3c4d5e6f',
  email: 'paciente@test.com',
  role: 'patient',
}
const PASSWORD = '12345678'

// A token shaped like the API's, valid for an hour. The signature is fake: nothing checks it
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
const fakeToken = () =>
  `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: patient.id, exp: Math.floor(Date.now() / 1000) + 3600 })}.fake`

const readJson = async (request) => {
  let text = ''
  for await (const chunk of request) text += chunk
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

const hasSession = (request) =>
  (request.headers.cookie ?? '')
    .split(';')
    .some((pair) => pair.trim().startsWith(`${SESSION_COOKIE}=`))

const routes = {
  'GET /health': () => ({
    status: 200,
    body: {
      status: 'ok',
      database: 'up',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  }),

  'POST /auth/login': async (request) => {
    const { email, password } = await readJson(request)
    if (email !== patient.email || password !== PASSWORD) {
      return { status: 401, body: { error: 'Invalid email or password' } }
    }
    return {
      status: 200,
      body: { user: patient },
      headers: {
        'Set-Cookie': `${SESSION_COOKIE}=${fakeToken()}; Max-Age=3600; Path=/; HttpOnly; SameSite=Strict`,
      },
    }
  },

  'GET /auth/me': (request) =>
    hasSession(request)
      ? { status: 200, body: { user: patient } }
      : { status: 401, body: { error: 'Authentication required' } },
}

createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost')
  const route = routes[`${request.method} ${pathname}`]
  const {
    status,
    body,
    headers = {},
  } = route ? await route(request) : { status: 404, body: { error: 'Not found' } }

  response.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  response.end(JSON.stringify(body))
}).listen(PORT, () => {
  console.log(`Fake API ready on http://localhost:${PORT}`)
})
