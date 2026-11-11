import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

describe('parseEnv', () => {
  it('points to the API on port 3000 by default', () => {
    expect(parseEnv({})).toEqual({ API_URL: 'http://localhost:3000' })
  })

  it('accepts another http or https URL', () => {
    expect(parseEnv({ API_URL: 'https://api.clinica.test' })).toEqual({
      API_URL: 'https://api.clinica.test',
    })
  })

  it('rejects a value that is not an http or https URL', () => {
    expect(() => parseEnv({ API_URL: 'localhost:3000' })).toThrow(
      'API_URL must be an http or https URL',
    )
  })
})
