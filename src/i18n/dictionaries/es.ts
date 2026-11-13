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
  notFound: {
    title: 'No encontramos esta página',
    description: 'Puede que la dirección esté mal escrita o que la página ya no exista.',
    home: 'Volver al inicio',
  },
  home: {
    title: 'Clínica',
    intro: 'Agenda tus citas, consulta tu expediente y escribe a la recepción desde un solo lugar.',
  },
}

export type Dictionary = typeof es
