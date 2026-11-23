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
