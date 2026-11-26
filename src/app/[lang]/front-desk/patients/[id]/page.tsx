import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PatientFile, PatientFileFallback } from '@/components/patient-file'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

// The id is only known when someone opens a patient (see appointments/[id]/page.tsx)
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const { patientPage } = await getDictionary()
  return { title: patientPage.title }
}

// Front desk only. The heading is in the static shell; the patient and their appointments read
// the URL and the session, so they stream in
export default async function PatientPage({
  params,
  searchParams,
}: PageProps<'/[lang]/front-desk/patients/[id]'>) {
  const locale = await getLocale()
  const { patientPage, appointmentPage } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{patientPage.title}</h1>
      <Suspense fallback={<PatientFileFallback label={patientPage.loading} />}>
        <PatientFile
          locale={locale}
          labels={patientPage}
          statuses={appointmentPage.statuses}
          params={params}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  )
}
