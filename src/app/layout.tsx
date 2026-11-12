import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { themeScript } from '@/theme/theme'
import './globals.css'
import { SkipLink } from '@/components/ui/skip-link'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: { default: 'Clínica', template: '%s | Clínica' },
  description: 'Agenda de citas, expediente clínico y chat con la recepción de la clínica.',
}

// suppressHydrationWarning: the theme script may add data-theme to <html> before React hydrates
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SkipLink />
        {children}
      </body>
    </html>
  )
}
