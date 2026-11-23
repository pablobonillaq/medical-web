import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DoctorDirectory, DoctorDirectoryFallback } from '@/components/doctor-directory'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { doctorsPage } = await getDictionary()
  return { title: doctorsPage.title, description: doctorsPage.description }
}

// Public: anyone can see it, without signing in. The heading is in the static shell; the
// directory depends on the filter in the URL (?service=), so it streams in behind <Suspense>
export default async function DoctorsPage({ searchParams }: PageProps<'/[lang]/doctors'>) {
  const locale = await getLocale()
  const { doctorsPage } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{doctorsPage.title}</h1>
        <p className="text-lg text-muted-foreground">{doctorsPage.intro}</p>
      </div>
      <Suspense fallback={<DoctorDirectoryFallback label={doctorsPage.loading} />}>
        <DoctorDirectory locale={locale} labels={doctorsPage} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
