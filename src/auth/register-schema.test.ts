import { describe, expect, it } from 'vitest'
import { validateRegistration, type RegisterInput } from './register-schema'

const TODAY = '2026-11-19'

const valid: RegisterInput = {
  firstName: ' Ana ',
  lastName: 'García López',
  birthDate: '1990-05-21',
  phone: '55 1234-5678',
  email: 'ana.garcia@test.com',
  password: '12345678',
  emailRemindersOptIn: true,
  whatsappOptIn: false,
}

const errorsOf = (changes: Partial<RegisterInput>) =>
  validateRegistration({ ...valid, ...changes }, TODAY).errors

describe('validateRegistration', () => {
  it('gives back the values to send, trimmed and with the phone in digits', () => {
    expect(validateRegistration(valid, TODAY)).toEqual({
      values: { ...valid, firstName: 'Ana', phone: '5512345678' },
      errors: null,
    })
  })

  it('says which fields are missing', () => {
    expect(
      errorsOf({ firstName: '', lastName: ' ', birthDate: '', phone: '', email: '', password: '' }),
    ).toEqual({
      firstName: 'required',
      lastName: 'required',
      birthDate: 'required',
      phone: 'required',
      email: 'required',
      password: 'required',
    })
  })

  it('checks the length of the names, like the API', () => {
    expect(errorsOf({ firstName: 'A', lastName: 'x'.repeat(81) })).toMatchObject({
      firstName: 'tooShort',
      lastName: 'tooLong',
    })
  })

  it('accepts a birth date up to today and from 1900 on', () => {
    expect(errorsOf({ birthDate: TODAY })).toBeNull()
    expect(errorsOf({ birthDate: '1900-01-01' })).toBeNull()
    expect(errorsOf({ birthDate: '2026-11-20' })).toMatchObject({ birthDate: 'future' })
    expect(errorsOf({ birthDate: '1899-12-31' })).toMatchObject({ birthDate: 'tooOld' })
    expect(errorsOf({ birthDate: '2026-02-30' })).toMatchObject({ birthDate: 'invalid' })
  })

  it('accepts a Mexican mobile number with or without +52', () => {
    expect(errorsOf({ phone: '+52 (55) 1234 5678' })).toBeNull()
    expect(errorsOf({ phone: '55 1234 567' })).toMatchObject({ phone: 'invalid' })
    expect(errorsOf({ phone: '+1 555 123 4567' })).toMatchObject({ phone: 'invalid' })
  })

  it('checks the email and the password like the sign-in form', () => {
    expect(errorsOf({ email: 'ana', password: '1234' })).toMatchObject({
      email: 'invalid',
      password: 'tooShort',
    })
  })
})
