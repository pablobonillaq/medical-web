// The Spanish texts are the reference: every other language must have the same keys
export const es = {
  metadata: {
    siteName: 'Clínica',
    description: 'Agenda de citas, expediente clínico y chat con la recepción de la clínica.',
  },
  skipLink: 'Saltar al contenido principal',
  toast: {
    close: 'Cerrar aviso',
  },
  theme: {
    legend: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
  },
  language: {
    label: 'Idioma',
  },
  footer: {
    note: 'Proyecto de portafolio. Todos los datos son ficticios.',
  },
  apiStatus: {
    unknown: 'Comprobando el servicio…',
    online: 'Servicio disponible',
    offline: 'Servicio no disponible',
    retry: 'Reintentar',
    lost: 'Se perdió la conexión con el servicio',
    restored: 'La conexión con el servicio volvió',
  },
  notFound: {
    title: 'No encontramos esta página',
    description: 'Puede que la dirección esté mal escrita o que la página ya no exista.',
    home: 'Volver al inicio',
  },
  account: {
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    signingOut: 'cerrando sesión',
    signedInAs: 'Sesión iniciada como',
    myAccount: 'Mi cuenta',
    signOutFailed: 'No pudimos cerrar tu sesión. Revisa tu conexión e inténtalo de nuevo.',
    roles: {
      admin: 'Administración',
      doctor: 'Médico',
      employee: 'Recepción',
      patient: 'Paciente',
    },
  },
  accountPage: {
    title: 'Mi cuenta',
    loading: 'Cargando tu cuenta…',
    email: 'Correo electrónico',
    role: 'Rol',
  },
  forbidden: {
    title: 'No tienes acceso a esta página',
    description:
      'Tu cuenta no tiene permiso para ver esta página. Si crees que es un error, comunícate con la recepción de la clínica.',
    home: 'Volver al inicio',
  },
  login: {
    title: 'Iniciar sesión',
    intro: 'Entra con el correo y la contraseña de tu cuenta.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    submit: 'Iniciar sesión',
    submitting: 'iniciando sesión',
    fieldErrors: {
      email: {
        required: 'Escribe tu correo electrónico.',
        invalid: 'Escribe un correo válido, como nombre@ejemplo.com.',
      },
      password: {
        required: 'Escribe tu contraseña.',
        tooShort: 'La contraseña tiene al menos 8 caracteres.',
        tooLong: 'La contraseña tiene como máximo 72 caracteres.',
      },
    },
    noAccount: '¿No tienes cuenta?',
    register: 'Crea una cuenta de paciente',
    errorTitle: 'No pudimos iniciar tu sesión',
    errors: {
      invalidCredentials: 'El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.',
      disabled: 'Tu cuenta está desactivada. Comunícate con la recepción de la clínica.',
      tooManyAttempts: 'Hubo demasiados intentos. Espera 15 minutos e inténtalo de nuevo.',
      network: 'No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.',
      unknown: 'Algo salió mal. Inténtalo de nuevo en unos minutos.',
    },
  },
  register: {
    title: 'Crear cuenta',
    intro: 'Crea tu cuenta de paciente para agendar tus citas y escribir a la recepción.',
    firstName: 'Nombre',
    lastName: 'Apellidos',
    birthDate: 'Fecha de nacimiento',
    phone: 'Teléfono celular',
    phoneHint: 'Diez dígitos, por ejemplo 55 1234 5678.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    passwordHint: 'Al menos 8 caracteres.',
    reminders: 'Recordatorios de tus citas',
    emailReminders: 'Quiero recibir recordatorios por correo',
    whatsappReminders: 'Quiero recibir recordatorios por WhatsApp',
    submit: 'Crear cuenta',
    submitting: 'creando la cuenta',
    haveAccount: '¿Ya tienes cuenta?',
    signIn: 'Inicia sesión',
    fieldErrors: {
      firstName: {
        required: 'Escribe tu nombre.',
        tooShort: 'El nombre tiene al menos 2 letras.',
        tooLong: 'El nombre tiene como máximo 80 caracteres.',
      },
      lastName: {
        required: 'Escribe tus apellidos.',
        tooShort: 'Los apellidos tienen al menos 2 letras.',
        tooLong: 'Los apellidos tienen como máximo 80 caracteres.',
      },
      birthDate: {
        required: 'Escribe tu fecha de nacimiento.',
        invalid: 'Escribe una fecha válida.',
        future: 'La fecha de nacimiento no puede ser posterior a hoy.',
        tooOld: 'Escribe una fecha a partir de 1900.',
      },
      phone: {
        required: 'Escribe tu teléfono celular.',
        invalid: 'Escribe un celular de México con 10 dígitos.',
      },
      email: {
        required: 'Escribe tu correo electrónico.',
        invalid: 'Escribe un correo válido, como nombre@ejemplo.com.',
      },
      password: {
        required: 'Escribe una contraseña.',
        tooShort: 'Usa al menos 8 caracteres.',
        tooLong: 'Usa como máximo 72 caracteres.',
      },
    },
    errorTitle: 'No pudimos crear tu cuenta',
    errors: {
      emailTaken: 'Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.',
      invalidData: 'Revisa tus datos e inténtalo de nuevo.',
      tooManyAttempts: 'Se crearon demasiadas cuentas desde esta red. Inténtalo más tarde.',
      network: 'No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.',
      unknown: 'Algo salió mal. Inténtalo de nuevo en unos minutos.',
    },
  },
  home: {
    title: 'Clínica',
    intro: 'Agenda tus citas, consulta tu expediente y escribe a la recepción desde un solo lugar.',
  },
}

export type Dictionary = typeof es
