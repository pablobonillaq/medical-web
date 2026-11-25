import { http, HttpResponse } from 'msw/http'
import { testDoctors, testServices } from './catalog'
import { testAccessLog, testProfile } from './patients'
import { testAppointment, testAvailability } from './appointments'

// The default answers of the fake API, shaped like the real Express API. A test that needs
// another answer replaces one with server.use(...) for that test only.
// "*/api/..." matches the path on any origin
export const handlers = [
  http.get('*/api/health', () =>
    HttpResponse.json({
      status: 'ok',
      database: 'up',
      uptime: 120,
      timestamp: '2026-11-18T10:00:00.000Z',
    }),
  ),
  http.patch('*/api/appointments/:id/reschedule', () =>
    HttpResponse.json({ appointment: testAppointment }),
  ),
  // The Next.js server reads the catalog straight from the API (API_URL), without /api
  http.get('*/services', () => HttpResponse.json({ services: testServices })),
  http.get('*/doctors', () => HttpResponse.json({ doctors: testDoctors })),
  // The signed-in patient's profile, read on the server, and the change the browser sends
  http.get('*/patients/me', () => HttpResponse.json({ patient: testProfile })),
  http.get('*/patients/me/access-log', () => HttpResponse.json(testAccessLog)),
  http.patch('*/api/patients/:id', async ({ request }) =>
    HttpResponse.json({
      patient: {
        ...testProfile,
        ...((await request.json()) as object),
        updatedAt: new Date().toISOString(),
      },
    }),
  ),
  // Booking: the free times and one appointment, read on the server; the booking itself is sent
  // by the browser
  http.get('*/availability', () => HttpResponse.json(testAvailability)),
  http.get('*/appointments/:id', () => HttpResponse.json({ appointment: testAppointment })),
  // The patient's appointments, one page, and the changes the browser sends
  http.get('*/appointments', () =>
    HttpResponse.json({ appointments: [testAppointment], page: 1, pageSize: 10, total: 1 }),
  ),
  http.patch('*/api/appointments/:id/status', () =>
    HttpResponse.json({ appointment: { ...testAppointment, status: 'confirmed' } }),
  ),
  http.patch('*/api/appointments/:id/cancel', () =>
    HttpResponse.json({ appointment: { ...testAppointment, status: 'cancelled' } }),
  ),
  http.post('*/api/appointments', () =>
    HttpResponse.json({ appointment: testAppointment }, { status: 201 }),
  ),
]
