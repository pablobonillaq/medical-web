import type { Role } from '@/auth/types'

// A patient's profile, as GET /patients/me answers it (medical-api, patients.types.ts)
export type Patient = {
  id: string
  firstName: string
  lastName: string
  // "1990-05-21"
  birthDate: string
  // Always in E.164 format: "+525512345678"
  phone: string
  // For reminders; when it is null, they go to the account's email
  contactEmail: string | null
  // The account's email (null for patients registered by the front desk, without an account)
  email: string | null
  emailRemindersOptIn: boolean
  whatsappOptIn: boolean
  updatedAt: string
}

// What was done with the record (medical-api, AuditAction and AuditResource)
export type AccessAction = 'read' | 'create' | 'update' | 'denied'
export type AccessResource = 'medical_history' | 'clinical_note' | 'attachment'

// Who opened the patient's record and when, as GET /patients/me/access-log answers it. The API
// keeps the staff's emails, IPs and browsers private; the name is null for staff who are not
// doctors
export type AccessLogEntry = {
  id: string
  action: AccessAction
  resource: AccessResource
  resourceId: string | null
  // UTC instant
  createdAt: string
  actor: { role: Role; name: string | null }
}

export type AccessLogPage = {
  entries: AccessLogEntry[]
  page: number
  pageSize: number
  total: number
}
