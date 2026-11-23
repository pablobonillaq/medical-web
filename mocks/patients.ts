import type { Patient } from '@/patients/types'
import { testUsers } from './session'

// The profile of the fictitious patient, as GET /patients/me answers it
export const testProfile: Patient = {
  id: '0190a7b2-3333-7000-8000-000000000001',
  firstName: 'Luz',
  lastName: 'Méndez',
  birthDate: '1990-05-21',
  phone: '+525512345678',
  contactEmail: null,
  email: testUsers.patient.email,
  emailRemindersOptIn: true,
  whatsappOptIn: false,
  updatedAt: '2026-11-20T10:00:00.000Z',
}
