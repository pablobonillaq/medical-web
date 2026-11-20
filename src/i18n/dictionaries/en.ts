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
  nav: {
    label: 'Main',
    services: 'Services',
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
  account: {
    signIn: 'Sign in',
    signOut: 'Sign out',
    signingOut: 'signing out',
    signedInAs: 'Signed in as',
    myAccount: 'My account',
    signOutFailed: "We couldn't sign you out. Check your connection and try again.",
    roles: {
      admin: 'Admin',
      doctor: 'Doctor',
      employee: 'Front desk',
      patient: 'Patient',
    },
  },
  sessionExpiry: {
    title: 'Your session is about to end',
    description:
      'For your security, your session ends at {time}. Save what you are writing and sign in again to continue.',
    signInAgain: 'Sign in again',
    stay: 'Stay here',
    close: 'Close notice',
    expired: 'Your session ended. Sign in again to continue.',
  },
  accountPage: {
    title: 'My account',
    loading: 'Loading your account…',
    email: 'Email',
    role: 'Role',
  },
  forbidden: {
    title: "You don't have access to this page",
    description:
      "Your account isn't allowed to see this page. If you think this is a mistake, contact the front desk of the clinic.",
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
    noAccount: "Don't have an account?",
    register: 'Create a patient account',
    errorTitle: "We couldn't sign you in",
    errors: {
      invalidCredentials: "The email or password don't match. Check them and try again.",
      disabled: 'Your account is disabled. Contact the front desk of the clinic.',
      tooManyAttempts: 'There were too many attempts. Wait 15 minutes and try again.',
      network: "We couldn't reach the service. Check your connection and try again.",
      unknown: 'Something went wrong. Try again in a few minutes.',
    },
  },
  register: {
    title: 'Create an account',
    intro: 'Create your patient account to book your appointments and message the front desk.',
    firstName: 'First name',
    lastName: 'Last name',
    birthDate: 'Date of birth',
    phone: 'Mobile phone',
    phoneHint: 'Ten digits, for example 55 1234 5678.',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 8 characters.',
    reminders: 'Appointment reminders',
    emailReminders: 'I want reminders by email',
    whatsappReminders: 'I want reminders by WhatsApp',
    submit: 'Create account',
    submitting: 'creating the account',
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
    fieldErrors: {
      firstName: {
        required: 'Enter your first name.',
        tooShort: 'Your first name has at least 2 letters.',
        tooLong: 'Your first name has at most 80 characters.',
      },
      lastName: {
        required: 'Enter your last name.',
        tooShort: 'Your last name has at least 2 letters.',
        tooLong: 'Your last name has at most 80 characters.',
      },
      birthDate: {
        required: 'Enter your date of birth.',
        invalid: 'Enter a valid date.',
        future: "Your date of birth can't be after today.",
        tooOld: 'Enter a date from 1900 on.',
      },
      phone: {
        required: 'Enter your mobile phone.',
        invalid: 'Enter a Mexican mobile number with 10 digits.',
      },
      email: {
        required: 'Enter your email.',
        invalid: 'Enter a valid email, like name@example.com.',
      },
      password: {
        required: 'Enter a password.',
        tooShort: 'Use at least 8 characters.',
        tooLong: 'Use at most 72 characters.',
      },
    },
    errorTitle: "We couldn't create your account",
    errors: {
      emailTaken: 'There is already an account with that email. Sign in or use another email.',
      invalidData: 'Check your details and try again.',
      tooManyAttempts: 'Too many accounts were created from this network. Try again later.',
      network: "We couldn't reach the service. Check your connection and try again.",
      unknown: 'Something went wrong. Try again in a few minutes.',
    },
  },
  home: {
    title: 'Clinic',
    intro:
      'Book your appointments, check your medical record and message the front desk, all in one place.',
  },
  servicesPage: {
    title: 'Services',
    description: "The clinic's services and how long each one takes.",
    intro: 'These are the services the clinic offers and how long each appointment takes.',
    loading: 'Loading services…',
    duration: 'Duration',
    empty: 'There are no services available right now.',
    unavailableTitle: "We couldn't load the services",
    unavailable: 'The service is not responding right now. Try again in a few minutes.',
  },
}
