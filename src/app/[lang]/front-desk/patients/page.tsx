import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PatientSearch, PatientSearchFallback } from '@/components/patient-search'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { patientsPage } = await getDictionary()
  return { title: patientsPage.title }
}

// Front desk only. The heading is in the static shell; the search reads the session and the
// URL, so it streams in. Without a session the Proxy already sent the visitor to sign in
export default async function PatientsPage({
  searchParams,
}: PageProps<'/[lang]/front-desk/patients'>) {
  const locale = await getLocale()
  const { patientsPage } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{patientsPage.title}</h1>
        <p className="text-lg text-muted-foreground">{patientsPage.intro}</p>
      </div>
      <Suspense fallback={<PatientSearchFallback label={patientsPage.loading} />}>
        <PatientSearch locale={locale} labels={patientsPage} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
