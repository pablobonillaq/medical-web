import { z } from 'zod'

// The same rules as the API (medical-api, users.schema.ts), checked before sending, so the
// visitor gets the error next to the field at once. The API checks them again.
// The messages are keys of the dictionary (login.fieldErrors), not texts
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: 'required' })
    .pipe(z.email({ error: 'invalid' })),
  password: z
    .string()
    .min(1, { error: 'required' })
    .min(8, { error: 'tooShort' })
    .max(72, { error: 'tooLong' }),
})

export type LoginValues = z.infer<typeof loginSchema>

export type LoginFieldErrors = {
  email?: 'required' | 'invalid'
  password?: 'required' | 'tooShort' | 'tooLong'
}

// The first problem of each field, or null when the values can be sent
export function validateLogin(
  values: Record<keyof LoginValues, string>,
): { values: LoginValues; errors: null } | { values: null; errors: LoginFieldErrors } {
  const result = loginSchema.safeParse(values)
  if (result.success) return { values: result.data, errors: null }

  const { fieldErrors } = z.flattenError(result.error)
  return {
    values: null,
    errors: {
      email: fieldErrors.email?.[0],
      password: fieldErrors.password?.[0],
    } as LoginFieldErrors,
  }
}
