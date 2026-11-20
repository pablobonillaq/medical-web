// The clinic's catalog in the tests, as GET /services answers it. Fictitious, like the
// services in medical-api/requests.http
export const testServices = [
  {
    id: '0190a7b2-1111-7000-8000-000000000001',
    name: 'Consulta general',
    description: 'Valoración médica de primera vez o de seguimiento.',
    durationMinutes: 30,
    active: true,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: '0190a7b2-1111-7000-8000-000000000002',
    name: 'Ultrasonido',
    description: null,
    durationMinutes: 45,
    active: true,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
]
