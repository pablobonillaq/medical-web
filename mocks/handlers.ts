import { http, HttpResponse } from 'msw/http'
import { testDoctors, testServices } from './catalog'

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
  // The Next.js server reads the catalog straight from the API (API_URL), without /api
  http.get('*/services', () => HttpResponse.json({ services: testServices })),
  http.get('*/doctors', () => HttpResponse.json({ doctors: testDoctors })),
]
