import { describe, expect, it } from 'vitest'
import { apiRewrites } from './rewrites'

describe('apiRewrites', () => {
  it('forwards every /api path to the API, without the /api prefix', () => {
    expect(apiRewrites('http://localhost:3000')).toEqual([
      { source: '/api/:path*', destination: 'http://localhost:3000/:path*' },
    ])
  })

  it('ignores a trailing slash in the API URL', () => {
    expect(apiRewrites('https://api.clinica.test/')[0]?.destination).toBe(
      'https://api.clinica.test/:path*',
    )
  })
})