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
  login: {
    title: 'Sign in',
    intro: 'Use the email and password of your account.',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'signing in',
    fieldErrors: {
      email: {
        required: 'Enter your email.',
        invalid: 'Enter a valid email, like name@example.com.',
      },
      password: {
        required: 'Enter your password.',
        tooShort: 'Your password has at least 8 characters.',
        tooLong: 'Your password has at most 72 characters.',
      },
    },
    errorTitle: "We couldn't sign you in",
    errors: {
      invalidCredentials: "The email or password don't match. Check them and try again.",
      disabled: 'Your account is disabled. Contact the front desk of the clinic.',
      tooManyAttempts: 'There were too many attempts. Wait 15 minutes and try again.',
      network: "We couldn't reach the service. Check your connection and try again.",
      unknown: 'Something went wrong. Try again in a few minutes.',
    },
  },
  home: {
    title: 'Clinic',
    intro:
      'Book your appointments, check your medical record and message the front desk, all in one place.',
  },
}
