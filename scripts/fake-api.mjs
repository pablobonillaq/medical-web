// A stand-in for the Express API in the end-to-end tests and Lighthouse CI, which run without
// the API and its database. It answers only what the pages ask for today, shaped like the real
// API; anything else is 404. Next.js forwards /api/* to it through API_URL, as it would to the
// real API. The accounts are fictitious, like the ones in medical-api/requests.http
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.FAKE_API_PORT ?? 3000)
const SESSION_COOKIE = 'access_token'

const patient = {
  id: '7d1f6c2a-4b5e-4f3a-9c8d-1a2b3c4d5e6f',
  email: 'paciente@test.com',
  role: 'patient',
}
const PASSWORD = '12345678'

// The clinic's active services, as GET /services lists them (sorted by name)
const service = (id, name, description, durationMinutes) => ({
  id: `0190a7b2-1111-7000-8000-00000000000${id}`,
  name,
  description,
  durationMinutes,
  active: true,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
})
const services = [
  service(1, 'Consulta general', 'Valoración médica de primera vez o de seguimiento.', 30),
  service(2, 'Electrocardiograma', 'Registro de la actividad eléctrica del corazón.', 20),
  service(3, 'Pediatría', 'Consulta para niñas, niños y adolescentes.', 30),
  service(4, 'Ultrasonido', null, 45),
]

// The accounts, by email. Patients who sign up in the tests are added here, in memory only
const accounts = new Map([[patient.email, { user: patient, password: PASSWORD }]])

// A token shaped like the API's, valid for an hour. The signature is fake: nothing checks it
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))
const fakeToken = (user) =>
  `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })}.fake`

const readJson = async (request) => {
  let text = ''
  for await (const chunk of request) text += chunk
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

// The account of the session cookie, if any
const sessionUser = (request) => {
  const cookie = (request.headers.cookie ?? '')
    .split(';')
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${SESSION_COOKIE}=`))
  if (!cookie) return null
  try {
    const { sub } = decode(cookie.slice(SESSION_COOKIE.length + 1).split('.')[1])
    return [...accounts.values()].find(({ user }) => user.id === sub)?.user ?? null
  } catch {
    return null
  }
}

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

  'POST /auth/register': async (request) => {
    const { email, password, firstName, lastName } = await readJson(request)
    if (accounts.has(email)) return { status: 409, body: { error: 'Email is already registered' } }

    const user = { id: randomUUID(), email, role: 'patient' }
    accounts.set(email, { user, password })
    return { status: 201, body: { patient: { id: randomUUID(), firstName, lastName } } }
  },

  'POST /auth/login': async (request) => {
    const { email, password } = await readJson(request)
    const account = accounts.get(email)
    if (!account || account.password !== password) {
      return { status: 401, body: { error: 'Invalid email or password' } }
    }
    return {
      status: 200,
      body: { user: account.user },
      headers: {
        'Set-Cookie': `${SESSION_COOKIE}=${fakeToken(account.user)}; Max-Age=3600; Path=/; HttpOnly; SameSite=Strict`,
      },
    }
  },

  'POST /auth/logout': () => ({
    status: 204,
    headers: { 'Set-Cookie': `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict` },
  }),

  // Public: anyone can see the services, as in the real API
  'GET /services': () => ({ status: 200, body: { services } }),

  'GET /auth/me': (request) => {
    const user = sessionUser(request)
    return user
      ? { status: 200, body: { user } }
      : { status: 401, body: { error: 'Authentication required' } }
  },
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
  // 204 No Content has no body
  response.end(body === undefined ? undefined : JSON.stringify(body))
}).listen(PORT, () => {
  console.log(`Fake API ready on http://localhost:${PORT}`)
})
