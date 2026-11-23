import { z } from 'zod'
import { birthDateField, nameField, phoneField } from '@/auth/register-schema'

// The rules of the API for a profile change (medical-api, patients.schema.ts), checked before
// sending. The same as when signing up, plus the optional contact email. The messages are keys
// of the dictionary (profilePage.fieldErrors), not texts
const contactEmailField = z
  .string()
  .trim()
  // An empty field removes the contact email: reminders go to the account's email
  .transform((email) => (email === '' ? null : email))
  .pipe(z.email({ error: 'invalid' }).nullable())

const profileSchema = (today: string) =>
  z.object({
    firstName: nameField,
    lastName: nameField,
    birthDate: birthDateField(today),
    phone: phoneField,
    contactEmail: contactEmailField,
    emailRemindersOptIn: z.boolean(),
    whatsappOptIn: z.boolean(),
  })

export type ProfileValues = z.infer<ReturnType<typeof profileSchema>>

type TextField = 'firstName' | 'lastName' | 'birthDate' | 'phone' | 'contactEmail'

export type ProfileFieldErrors = Partial<Record<TextField, string>>

export type ProfileInput = Record<TextField, string> & {
  emailRemindersOptIn: boolean
  whatsappOptIn: boolean
}

const TEXT_FIELDS: TextField[] = ['firstName', 'lastName', 'birthDate', 'phone', 'contactEmail']

// The first problem of each field, or null when the values can be sent
export function validateProfile(
  input: ProfileInput,
  today: string,
): { values: ProfileValues; errors: null } | { values: null; errors: ProfileFieldErrors } {
  const result = profileSchema(today).safeParse(input)
  if (result.success) return { values: result.data, errors: null }

  const { fieldErrors } = z.flattenError(result.error)
  return {
    values: null,
    errors: Object.fromEntries(
      TEXT_FIELDS.map((field) => [field, fieldErrors[field]?.[0]]),
    ) as ProfileFieldErrors,
  }
}
