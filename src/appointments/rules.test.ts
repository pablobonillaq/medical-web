import { describe, expect, it } from 'vitest'
import { patientActions } from './rules'

const now = new Date('2026-11-24T18:00:00.000Z')
const inHours = (hours: number) => new Date(now.getTime() + hours * 3_600_000).toISOString()

describe('patientActions', () => {
  it('lets the patient confirm, cancel or move a booked appointment with enough notice', () => {
    expect(patientActions({ status: 'scheduled', startsAt: inHours(24) }, now)).toEqual({
      canConfirm: true,
      canCancel: true,
      canReschedule: true,
      tooLateToCancel: false,
    })
  })

  it('lets the patient cancel or move, but not confirm again, a confirmed appointment', () => {
    expect(patientActions({ status: 'confirmed', startsAt: inHours(24) }, now)).toEqual({
      canConfirm: false,
      canCancel: true,
      canReschedule: true,
      tooLateToCancel: false,
    })
  })

  it('sends the patient to call when there are less than 2 hours left', () => {
    expect(patientActions({ status: 'scheduled', startsAt: inHours(1) }, now)).toEqual({
      canConfirm: true,
      canCancel: false,
      canReschedule: false,
      tooLateToCancel: true,
    })
    expect(patientActions({ status: 'confirmed', startsAt: inHours(2) }, now).canCancel).toBe(true)
  })

  it.each(['cancelled', 'completed', 'no_show'] as const)('allows nothing once %s', (status) => {
    expect(patientActions({ status, startsAt: inHours(24) }, now)).toEqual({
      canConfirm: false,
      canCancel: false,
      canReschedule: false,
      tooLateToCancel: false,
    })
  })

  it('allows nothing once the appointment started', () => {
    expect(patientActions({ status: 'scheduled', startsAt: inHours(-1) }, now)).toEqual({
      canConfirm: false,
      canCancel: false,
      canReschedule: false,
      tooLateToCancel: false,
    })
  })
})
