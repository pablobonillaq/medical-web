import type { Role } from '@/auth/types'

// Fictitious accounts, like the ones in medical-api/requests.http
export const testUsers = {
  patient: {
    id: '7d1f6c2a-4b5e-4f3a-9c8d-1a2b3c4d5e6f',
    email: 'paciente@test.com',
    role: 'patient',
  },
  employee: {
    id: '2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f',
    email: 'recepcion@clinica.test',
    role: 'employee',
  },
} satisfies Record<string, { id: string; email: string; role: Role }>

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

// A token shaped like the ones the API signs. The signature is fake: only the API checks it
export const fakeToken = (payload: object) =>
  `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`
