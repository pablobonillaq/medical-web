import { describe, expect, it } from 'vitest'
import { addDays, clinicDate } from './clinic'

describe('clinicDate', () => {
  it("is the date at the clinic, not the visitor's or UTC's", () => {
    // 3:00 UTC on November 24 is still 21:00 on November 23 in Mexico City
    expect(clinicDate(new Date('2026-11-24T03:00:00.000Z'))).toBe('2026-11-23')
    expect(clinicDate(new Date('2026-11-24T07:00:00.000Z'))).toBe('2026-11-24')
  })
})

describe('addDays', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-11-23', 90)).toBe('2027-02-21')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})
