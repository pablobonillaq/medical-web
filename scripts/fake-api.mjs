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

const employee = {
  id: '2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f',
  email: 'recepcion@clinica.test',
  role: 'employee',
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

// The active doctors as a visitor sees them: the public profile, sorted by last name
const offering = (...ids) => services.filter((_, index) => ids.includes(index + 1))
const doctor = (id, firstName, lastName, specialty, licenseNumber, serviceIds) => ({
  id: `0190a7b2-2222-7000-8000-00000000000${id}`,
  firstName,
  lastName,
  specialty,
  licenseNumber,
  services: offering(...serviceIds).map(({ id, name, durationMinutes }) => ({
    id,
    name,
    durationMinutes,
  })),
})
const doctors = [
  doctor(1, 'Ana', 'Garay', 'Medicina general', '12345678', [1, 2]),
  doctor(2, 'Sofía', 'Morales', 'Pediatría', '23456789', [1, 3]),
  doctor(3, 'Luis', 'Ruiz', 'Radiología', '7654321', [4]),
]

// The accesses to the fictitious patient's record, the latest first. Staff names are shown only
// for doctors, as in the real API
const accessLog = [
  {
    id: '0190a7b2-5555-7000-8000-000000000003',
    action: 'create',
    resource: 'clinical_note',
    resourceId: '0190a7b2-6666-7000-8000-000000000001',
    createdAt: '2026-11-20T16:20:00.000Z',
    actor: { role: 'doctor', name: 'Ana Garay' },
  },
  {
    id: '0190a7b2-5555-7000-8000-000000000002',
    action: 'read',
    resource: 'medical_history',
    resourceId: null,
    createdAt: '2026-11-20T16:05:00.000Z',
    actor: { role: 'doctor', name: 'Ana Garay' },
  },
  {
    id: '0190a7b2-5555-7000-8000-000000000001',
    action: 'denied',
    resource: 'clinical_note',
    resourceId: '0190a7b2-6666-7000-8000-000000000001',
    createdAt: '2026-11-19T21:30:00.000Z',
    actor: { role: 'employee', name: null },
  },
]

// Appointments, by id, with the account of the patient who booked them. In memory only
const appointments = new Map()

// The clinic is in Mexico City: UTC-6 all year. Every doctor works from 9:00 to 13:00, with a
// possible start every 15 minutes, as in the real API
const CLINIC_OFFSET_HOURS = 6
const clinicToday = () =>
  new Date(Date.now() - CLINIC_OFFSET_HOURS * 3_600_000).toISOString().slice(0, 10)
const daysBetween = (from, to) => (Date.parse(to) - Date.parse(from)) / 86_400_000

// The free times of a doctor for a service on a date, or the reason the API would give for none
const freeSlots = (doctorId, serviceId, date) => {
  const doctor = doctors.find(({ id }) => id === doctorId)
  if (!doctor) return { status: 404, body: { error: 'Doctor not found' } }
  const service = doctor.services.find(({ id }) => id === serviceId)
  if (!service) return { status: 400, body: { error: 'The doctor does not offer this service' } }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
    return { status: 400, body: { error: 'date must use the YYYY-MM-DD format' } }
  }
  const daysAhead = daysBetween(clinicToday(), date)
  if (daysAhead < 0) return { status: 400, body: { error: 'date cannot be in the past' } }
  if (daysAhead > 90) return { status: 400, body: { error: 'date can be at most 90 days ahead' } }

  const taken = [...appointments.values()]
    // Cancelled appointments free their time, as in the real API
    .filter(({ appointment }) => appointment.doctor.id === doctorId)
    .filter(({ appointment }) => ['scheduled', 'confirmed'].includes(appointment.status))
    .map(({ appointment }) => appointment.startsAt)
  const slots = []
  for (let minute = 9 * 60; minute + service.durationMinutes <= 13 * 60; minute += 15) {
    const startsAt = new Date(
      Date.parse(`${date}T00:00:00.000Z`) + (minute + CLINIC_OFFSET_HOURS * 60) * 60_000,
    )
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000)
    if (startsAt.getTime() <= Date.now() || taken.includes(startsAt.toISOString())) continue
    const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
    slots.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), time })
  }
  return {
    status: 200,
    body: {
      date,
      timeZone: 'America/Mexico_City',
      durationMinutes: service.durationMinutes,
      slots,
    },
  }
}

// The accounts, by email. Patients who sign up in the tests are added here, in memory only
const accounts = new Map([
  [patient.email, { user: patient, password: PASSWORD }],
  [employee.email, { user: employee, password: PASSWORD }],
])

// Each patient's profile, by the id of their account, as GET /patients/me answers it
const profile = (user, data) => ({
  id: randomUUID(),
  firstName: data.firstName,
  lastName: data.lastName,
  birthDate: data.birthDate,
  phone: `+52${String(data.phone).replace(/\D/g, '').slice(-10)}`,
  contactEmail: data.contactEmail ?? null,
  email: user.email,
  emailRemindersOptIn: data.emailRemindersOptIn ?? false,
  whatsappOptIn: data.whatsappOptIn ?? false,
  updatedAt: new Date().toISOString(),
})
const profiles = new Map([
  [
    patient.id,
    profile(patient, {
      firstName: 'Luz',
      lastName: 'Méndez',
      birthDate: '1990-05-21',
      phone: '5512345678',
      emailRemindersOptIn: true,
    }),
  ],
  // Patients the front desk registered, without an account: by the id of their profile
  ...[
    { firstName: 'Ramón', lastName: 'Ortega Salas', birthDate: '1958-03-14', phone: '5587654321' },
    { firstName: 'Elena', lastName: 'Quiroga', birthDate: '2015-09-02', phone: '5544332211' },
  ].map((data) => {
    const walkIn = profile({ email: null }, data)
    return [walkIn.id, walkIn]
  }),
])

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
    const data = await readJson(request)
    const { email, password } = data
    if (accounts.has(email)) return { status: 409, body: { error: 'Email is already registered' } }

    const user = { id: randomUUID(), email, role: 'patient' }
    accounts.set(email, { user, password })
    profiles.set(user.id, profile(user, data))
    return { status: 201, body: { patient: profiles.get(user.id) } }
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

  // Public: anyone can see the services and doctors, as in the real API
  'GET /services': () => ({ status: 200, body: { services } }),

  'GET /doctors': () => ({ status: 200, body: { doctors } }),

  // Only the signed-in patient's own profile
  'GET /patients/me': (request) => {
    const user = sessionUser(request)
    if (!user) return { status: 401, body: { error: 'Authentication required' } }
    if (user.role !== 'patient') return { status: 403, body: { error: 'Forbidden' } }
    return { status: 200, body: { patient: profiles.get(user.id) } }
  },

  // The front desk looks patients up by name or phone, as the real API does: every word in the
  // first name or the last name (ignoring case), or at least 4 digits of the phone. Sorted by
  // last name
  'GET /patients': (request) => {
    const user = sessionUser(request)
    if (!user) return { status: 401, body: { error: 'Authentication required' } }
    if (!['employee', 'admin'].includes(user.role)) {
      return { status: 403, body: { error: 'Forbidden' } }
    }
    const query = new URL(request.url, 'http://localhost').searchParams
    const search = query.get('search')?.trim() ?? ''
    if (search.length === 1) {
      return { status: 400, body: { error: 'search must be at least 2 characters' } }
    }
    const page = Number(query.get('page') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)
    const words = search.toLowerCase().split(/\s+/).filter(Boolean)
    const digits = search.replace(/\D/g, '')
    const found = [...profiles.values()]
      .filter(
        ({ firstName, lastName, phone }) =>
          words.every((word) =>
            [firstName, lastName].some((name) => name.toLowerCase().includes(word)),
          ) ||
          (digits.length >= 4 && phone.includes(digits)),
      )
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
      .map((match) => ({ ...match, hasAccount: match.email !== null }))
    return {
      status: 200,
      body: {
        patients: found.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total: found.length,
      },
    }
  },

  // Who opened the record: a few accesses for the fictitious account, none for the patients
  // the tests sign up. The latest first, paginated as in the real API
  'GET /patients/me/access-log': (request) => {
    const user = sessionUser(request)
    if (!user) return { status: 401, body: { error: 'Authentication required' } }
    if (user.role !== 'patient') return { status: 403, body: { error: 'Forbidden' } }
    const query = new URL(request.url, 'http://localhost').searchParams
    const page = Number(query.get('page') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)
    const entries = user.id === patient.id ? accessLog : []
    return {
      status: 200,
      body: {
        entries: entries.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total: entries.length,
      },
    }
  },

  'GET /availability': (request) => {
    if (!sessionUser(request)) return { status: 401, body: { error: 'Authentication required' } }
    const query = new URL(request.url, 'http://localhost').searchParams
    return freeSlots(query.get('doctorId'), query.get('serviceId'), query.get('date'))
  },

  // Patients book for themselves, only one of the free times
  'POST /appointments': async (request) => {
    const user = sessionUser(request)
    if (!user) return { status: 401, body: { error: 'Authentication required' } }
    const { doctorId, serviceId, startsAt, notes } = await readJson(request)
    const date = new Date(Date.parse(startsAt) - CLINIC_OFFSET_HOURS * 3_600_000)
      .toISOString()
      .slice(0, 10)
    const free = freeSlots(doctorId, serviceId, date)
    if (free.status !== 200) return free
    const slot = free.body.slots.find((candidate) => candidate.startsAt === startsAt)
    if (!slot) return { status: 409, body: { error: 'The requested time is not available' } }

    const doctor = doctors.find(({ id }) => id === doctorId)
    const service = doctor.services.find(({ id }) => id === serviceId)
    const appointment = {
      id: randomUUID(),
      status: 'scheduled',
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      notes: notes ?? null,
      service,
      doctor: {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialty: doctor.specialty,
      },
    }
    appointments.set(appointment.id, { appointment, userId: user.id })
    return { status: 201, body: { appointment } }
  },

  // Only the patient's own appointments, filtered and paginated as in the real API
  'GET /appointments': (request) => {
    const user = sessionUser(request)
    if (!user) return { status: 401, body: { error: 'Authentication required' } }
    const query = new URL(request.url, 'http://localhost').searchParams
    const from = query.get('from')
    const to = query.get('to')
    const page = Number(query.get('page') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)
    const direction = query.get('order') === 'desc' ? -1 : 1
    const mine = [...appointments.values()]
      .filter(({ userId }) => userId === user.id)
      .map(({ appointment }) => appointment)
      .filter(({ startsAt }) => (!from || startsAt >= from) && (!to || startsAt < to))
      .sort((a, b) => direction * a.startsAt.localeCompare(b.startsAt))
    return {
      status: 200,
      body: {
        appointments: mine.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total: mine.length,
      },
    }
  },

  'GET /auth/me': (request) => {
    const user = sessionUser(request)
    return user
      ? { status: 200, body: { user } }
      : { status: 401, body: { error: 'Authentication required' } }
  },
}

// The patient's own appointment that can still change, or the answer the API would give
const changeable = (request, id) => {
  const user = sessionUser(request)
  if (!user) return { error: { status: 401, body: { error: 'Authentication required' } } }
  const booked = appointments.get(id)
  if (booked?.userId !== user.id) {
    return { error: { status: 404, body: { error: 'Appointment not found' } } }
  }
  const { appointment } = booked
  if (!['scheduled', 'confirmed'].includes(appointment.status)) {
    return {
      error: {
        status: 409,
        body: { error: 'Only scheduled or confirmed appointments can change' },
      },
    }
  }
  return { appointment }
}

// Routes with an id in the path: the handler gets it after the request
const routesWithId = [
  {
    method: 'PATCH',
    path: /^\/appointments\/([^/]+)\/status$/,
    // Patients only confirm, before the appointment starts
    handler: async (request, id) => {
      const { appointment, error } = changeable(request, id)
      if (error) return error
      const { status } = await readJson(request)
      if (status !== 'confirmed' || appointment.status !== 'scheduled') {
        return { status: 409, body: { error: `Cannot change status to ${status}` } }
      }
      if (Date.parse(appointment.startsAt) <= Date.now()) {
        return { status: 400, body: { error: 'Only upcoming appointments can be confirmed' } }
      }
      appointment.status = 'confirmed'
      return { status: 200, body: { appointment } }
    },
  },
  {
    method: 'PATCH',
    path: /^\/appointments\/([^/]+)\/reschedule$/,
    // Another of the free times of the same doctor, with 2 hours of notice; booked again
    handler: async (request, id) => {
      const { appointment, error } = changeable(request, id)
      if (error) return error
      if (Date.parse(appointment.startsAt) - Date.now() < 2 * 3_600_000) {
        return {
          status: 400,
          body: { error: 'Patients can reschedule at least 2 hours in advance' },
        }
      }
      const { startsAt } = await readJson(request)
      if (startsAt === appointment.startsAt) {
        return { status: 400, body: { error: 'The new time is the same as the current one' } }
      }
      const date = new Date(Date.parse(startsAt) - CLINIC_OFFSET_HOURS * 3_600_000)
        .toISOString()
        .slice(0, 10)
      const free = freeSlots(appointment.doctor.id, appointment.service.id, date)
      if (free.status !== 200) return free
      const slot = free.body.slots.find((candidate) => candidate.startsAt === startsAt)
      if (!slot) return { status: 409, body: { error: 'The requested time is not available' } }
      Object.assign(appointment, {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        status: 'scheduled',
      })
      return { status: 200, body: { appointment } }
    },
  },
  {
    method: 'PATCH',
    path: /^\/appointments\/([^/]+)\/cancel$/,
    // Patients need at least 2 hours of notice; the reason is optional
    handler: async (request, id) => {
      const { appointment, error } = changeable(request, id)
      if (error) return error
      if (Date.parse(appointment.startsAt) - Date.now() < 2 * 3_600_000) {
        return { status: 400, body: { error: 'Patients can cancel at least 2 hours in advance' } }
      }
      const { reason } = await readJson(request)
      if (reason !== undefined && String(reason).trim().length < 3) {
        return { status: 400, body: { error: 'reason must be at least 3 characters' } }
      }
      appointment.status = 'cancelled'
      return { status: 200, body: { appointment } }
    },
  },
  {
    method: 'GET',
    path: /^\/appointments\/([^/]+)$/,
    // Only the patient's own appointments; anyone else's is a 404, as in the real API
    handler: (request, id) => {
      const user = sessionUser(request)
      if (!user) return { status: 401, body: { error: 'Authentication required' } }
      const booked = appointments.get(id)
      if (booked?.userId !== user.id)
        return { status: 404, body: { error: 'Appointment not found' } }
      return { status: 200, body: { appointment: booked.appointment } }
    },
  },
  {
    method: 'PATCH',
    path: /^\/patients\/([^/]+)$/,
    // A patient changes only their own profile; anyone else's id is a 404, as in the real API
    handler: async (request, id) => {
      const user = sessionUser(request)
      if (!user) return { status: 401, body: { error: 'Authentication required' } }
      const current = profiles.get(user.id)
      if (current?.id !== id) return { status: 404, body: { error: 'Patient not found' } }

      const changes = await readJson(request)
      const updated = { ...profile(user, { ...current, ...changes }), id }
      profiles.set(user.id, updated)
      return { status: 200, body: { patient: updated } }
    },
  },
]

const findRoute = (method, pathname) => {
  const route = routes[`${method} ${pathname}`]
  if (route) return route
  for (const { method: routeMethod, path, handler } of routesWithId) {
    const match = routeMethod === method && path.exec(pathname)
    if (match) return (request) => handler(request, match[1])
  }
  return undefined
}

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost')
  const route = findRoute(request.method, pathname)
  const {
    status,
    body,
    headers = {},
  } = route ? await route(request) : { status: 404, body: { error: 'Not found' } }

  response.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  // 204 No Content has no body
  response.end(body === undefined ? undefined : JSON.stringify(body))
})

// Next.js forwards /api/* through a pool of open connections. Node closes an idle connection
// after 5 seconds, so under load the proxy could reuse one just as it closed ("read
// ECONNRESET" and a failed request). Keeping them open longer than the proxy does avoids it
server.keepAliveTimeout = 65_000
server.headersTimeout = 66_000

server.listen(PORT, () => {
  console.log(`Fake API ready on http://localhost:${PORT}`)
})
