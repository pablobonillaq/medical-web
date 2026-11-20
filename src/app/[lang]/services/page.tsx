import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ServiceList, ServiceListFallback } from '@/components/service-list'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { servicesPage } = await getDictionary()
  return { title: servicesPage.title, description: servicesPage.description }
}

// Public: anyone can see it, without signing in. The list is cached, so it is usually part of
// the prerendered page; the fallback only shows if the API was down when it was cached
export default async function ServicesPage() {
  const locale = await getLocale()
  const { servicesPage } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{servicesPage.title}</h1>
        <p className="text-lg text-muted-foreground">{servicesPage.intro}</p>
      </div>
      <Suspense fallback={<ServiceListFallback label={servicesPage.loading} />}>
        <ServiceList locale={locale} labels={servicesPage} />
      </Suspense>
    </div>
  )
}
