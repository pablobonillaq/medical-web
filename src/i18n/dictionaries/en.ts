import type { Dictionary } from './es'

export const en: Dictionary = {
  metadata: {
    siteName: 'Clinic',
    description: "Appointment booking, medical records and chat with the clinic's front desk.",
  },
  skipLink: 'Skip to main content',
  toast: {
    close: 'Close notification',
  },
  theme: {
    legend: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  language: {
    label: 'Language',
  },
  footer: {
    note: 'Portfolio project. All data is fictitious.',
  },
  apiStatus: {
    unknown: 'Checking the service…',
    online: 'Service available',
    offline: 'Service unavailable',
    retry: 'Try again',
    lost: 'The connection to the service was lost',
    restored: 'The connection to the service is back',
  },
  notFound: {
    title: "We couldn't find this page",
    description: 'The address may be misspelled, or the page may no longer exist.',
    home: 'Back to home',
  },
  home: {
    title: 'Clinic',
    intro:
      'Book your appointments, check your medical record and message the front desk, all in one place.',
  },
}
