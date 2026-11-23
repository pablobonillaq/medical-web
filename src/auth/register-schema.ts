import { z } from 'zod'
import { emailField, passwordField } from './login-schema'

// The same rules as the API (medical-api, patients.schema.ts), checked before sending. The
// messages are keys of the dictionary (register.fieldErrors), not texts
export const nameField = z
  .string()
  .trim()
  .min(1, { error: 'required' })
  .min(2, { error: 'tooShort' })
  .max(80, { error: 'tooLong' })

// "1990-05-21", the value of <input type="date">: a real date, not in the future and not
// before 1900. today is the visitor's date, in the same format
export const birthDateField = (today: string) =>
  z
    .string()
    .min(1, { error: 'required' })
    .pipe(z.iso.date({ error: 'invalid' }))
    .refine((date) => date <= today, { error: 'future' })
    .refine((date) => date >= '1900-01-01', { error: 'tooOld' })

// A Mexican mobile number: 10 digits, with or without +52, spaces, dashes or parentheses
export const phoneField = z
  .string()
  .transform((phone) => phone.replace(/[\s()-]/g, ''))
  .pipe(
    z
      .string()
      .min(1, { error: 'required' })
      .regex(/^(\+?52)?\d{10}$/, { error: 'invalid' }),
  )

const registerSchema = (today: string) =>
  z.object({
    firstName: nameField,
    lastName: nameField,
    birthDate: birthDateField(today),
    phone: phoneField,
    email: emailField,
    password: passwordField,
    emailRemindersOptIn: z.boolean(),
    whatsappOptIn: z.boolean(),
  })

export type RegisterValues = z.infer<ReturnType<typeof registerSchema>>

type TextField = 'firstName' | 'lastName' | 'birthDate' | 'phone' | 'email' | 'password'

export type RegisterFieldErrors = Partial<Record<TextField, string>>

export type RegisterInput = Record<TextField, string> & {
  emailRemindersOptIn: boolean
  whatsappOptIn: boolean
}

const TEXT_FIELDS: TextField[] = [
  'firstName',
  'lastName',
  'birthDate',
  'phone',
  'email',
  'password',
]

// The first problem of each field, or null when the values can be sent
export function validateRegistration(
  input: RegisterInput,
  today: string,
): { values: RegisterValues; errors: null } | { values: null; errors: RegisterFieldErrors } {
  const result = registerSchema(today).safeParse(input)
  if (result.success) return { values: result.data, errors: null }

  const { fieldErrors } = z.flattenError(result.error)
  return {
    values: null,
    errors: Object.fromEntries(
      TEXT_FIELDS.map((field) => [field, fieldErrors[field]?.[0]]),
    ) as RegisterFieldErrors,
  }
}
