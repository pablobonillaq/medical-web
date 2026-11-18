import { describe, expect, it } from 'vitest'
import { validateLogin } from './login-schema'

describe('validateLogin', () => {
  it('gives back the values to send, with the email trimmed', () => {
    expect(validateLogin({ email: '  paciente@test.com ', password: '12345678' })).toEqual({
      values: { email: 'paciente@test.com', password: '12345678' },
      errors: null,
    })
  })

  it('says which fields are missing', () => {
    expect(validateLogin({ email: ' ', password: '' }).errors).toEqual({
      email: 'required',
      password: 'required',
    })
  })

  it('checks the email and the length of the password, like the API', () => {
    expect(validateLogin({ email: 'paciente', password: '1234567' }).errors).toEqual({
      email: 'invalid',
      password: 'tooShort',
    })
    expect(validateLogin({ email: 'paciente@test.com', password: 'x'.repeat(73) }).errors).toEqual({
      email: undefined,
      password: 'tooLong',
    })
    expect(validateLogin({ email: 'paciente', password: '12345678' }).errors).toEqual({
      email: 'invalid',
      password: undefined,
    })
  })
})
