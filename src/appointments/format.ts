import { CLINIC_TIME_ZONE } from '@/config/clinic'
import type { Locale } from '@/i18n/config'

// The date and time of an appointment at the clinic, written as each language does:
// "jueves, 26 de noviembre de 2026" and "9:00" (or "9:00 AM")
export const appointmentDate = (startsAt: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: CLINIC_TIME_ZONE }).format(
    new Date(startsAt),
  )

export const appointmentTime = (startsAt: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: CLINIC_TIME_ZONE }).format(
    new Date(startsAt),
  )
