import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BookingSteps, BookingStepsFallback } from '@/components/booking-steps'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { bookingPage } = await getDictionary()
  return { title: bookingPage.title }
}

// Patients only. The heading is in the static shell; the steps read the session and the URL, so
// they stream in. Without a session the Proxy already sent the visitor to sign in
export default async function BookingPage({ searchParams }: PageProps<'/[lang]/appointments/new'>) {
  const locale = await getLocale()
  const { bookingPage } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{bookingPage.title}</h1>
        <p className="text-lg text-muted-foreground">{bookingPage.intro}</p>
      </div>
      <Suspense fallback={<BookingStepsFallback label={bookingPage.loading} />}>
        <BookingSteps locale={locale} labels={bookingPage} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
