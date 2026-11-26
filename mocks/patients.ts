import type { AccessLogPage, Patient, PatientPage, StaffPatient } from '@/patients/types'
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

// Who opened the fictitious patient's record, the latest first, as GET /patients/me/access-log
// answers it: a doctor, by name, and someone from the front desk, by role only
export const testAccessLog: AccessLogPage = {
  entries: [
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
  ],
  page: 1,
  pageSize: 20,
  total: 2,
}

// A patient the front desk registered without an account, as GET /patients/:id answers it
export const testWalkIn: StaffPatient = {
  id: '0190a7b2-3333-7000-8000-000000000002',
  firstName: 'Ramón',
  lastName: 'Ortega Salas',
  birthDate: '1958-03-14',
  phone: '+525587654321',
  contactEmail: null,
  email: null,
  emailRemindersOptIn: false,
  whatsappOptIn: false,
  updatedAt: '2026-11-21T10:00:00.000Z',
  hasAccount: false,
}

// The front desk's search, as GET /patients answers it: the patient with an account and the one
// without, sorted by last name
export const testPatientPage: PatientPage = {
  patients: [{ ...testProfile, hasAccount: true }, testWalkIn],
  page: 1,
  pageSize: 20,
  total: 2,
}
