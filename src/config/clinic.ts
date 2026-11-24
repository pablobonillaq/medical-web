// The clinic's time zone, the same as the API's CLINIC_TIMEZONE: appointment dates and times
// are the clinic's, wherever the patient is
export const CLINIC_TIME_ZONE = 'America/Mexico_City'

// Patients can book up to this many days ahead (medical-api, appointments.constants.ts)
export const MAX_DAYS_AHEAD = 90

// "2026-11-23": the date at the clinic at that moment (en-CA writes YYYY-MM-DD)
export const clinicDate = (moment: Date) =>
  moment.toLocaleDateString('en-CA', { timeZone: CLINIC_TIME_ZONE })

// "2026-11-23" plus some days, as a date without time (UTC avoids daylight saving changes)
export const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T00:00:00.000Z`)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}

// Patients can cancel or reschedule up to this many hours before the appointment; with less
// notice, they call the clinic (medical-api, appointments.constants.ts)
export const MIN_PATIENT_NOTICE_HOURS = 2
