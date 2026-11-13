import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SkipLink } from '@/components/ui/skip-link'
import { ToastProvider } from '@/components/ui/toast'
import { LOCALES } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { themeScript } from '@/theme/theme'
import '../globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Both languages are prerendered at build time
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary()

  return {
    title: { default: metadata.siteName, template: `%s | ${metadata.siteName}` },
    description: metadata.description,
  }
}

// suppressHydrationWarning: the theme script may add data-theme to <html> before React hydrates
export default async function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  const locale = await getLocale()
  const dictionary = await getDictionary()

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SkipLink>{dictionary.skipLink}</SkipLink>
        <ToastProvider closeLabel={dictionary.toast.close}>{children}</ToastProvider>
      </body>
    </html>
  )
}
