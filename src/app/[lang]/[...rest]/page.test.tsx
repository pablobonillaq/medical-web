import { describe, expect, it } from 'vitest'
import CatchAll from './page'

describe('CatchAll', () => {
  it('answers every address that matches no page with a 404', () => {
    expect(() => CatchAll()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })
})
