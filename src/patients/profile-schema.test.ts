import { describe, expect, it } from 'vitest'
import { validateProfile, type ProfileInput } from './profile-schema'

const today = '2026-11-23'

const valid: ProfileInput = {
  firstName: ' Luz ',
  lastName: 'Méndez',
  birthDate: '1990-05-21',
  phone: '55 1234 5678',
  contactEmail: '',
  emailRemindersOptIn: true,
  whatsappOptIn: false,
}

describe('validateProfile', () => {
  it('cleans the values the API receives, and an empty contact email removes it', () => {
    expect(validateProfile(valid, today)).toEqual({
      values: {
        firstName: 'Luz',
        lastName: 'Méndez',
        birthDate: '1990-05-21',
        phone: '5512345678',
        contactEmail: null,
        emailRemindersOptIn: true,
        whatsappOptIn: false,
      },
      errors: null,
    })
  })

  it('keeps a contact email', () => {
    const { values } = validateProfile({ ...valid, contactEmail: ' luz@correo.test ' }, today)

    expect(values?.contactEmail).toBe('luz@correo.test')
  })

  it('names the first problem of each field', () => {
    expect(
      validateProfile(
        {
          ...valid,
          firstName: '',
          lastName: 'M',
          birthDate: '2027-01-01',
          phone: '123',
          contactEmail: 'luz@',
        },
        today,
      ),
    ).toEqual({
      values: null,
      errors: {
        firstName: 'required',
        lastName: 'tooShort',
        birthDate: 'future',
        phone: 'invalid',
        contactEmail: 'invalid',
      },
    })
  })
})
