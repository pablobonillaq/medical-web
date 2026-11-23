import Link from 'next/link'
import { Suspense } from 'react'
import { ServiceList, ServiceListFallback } from '@/components/service-list'
import { buttonVariants } from '@/components/ui/button'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

// How many services the home page shows; the rest are on the services page
const FEATURED_SERVICES = 3

// Public and prerendered: nothing here depends on who visits. The services come from the cache
// (see getServices), so they are usually part of the prerendered page too
export default async function HomePage() {
  const locale = await getLocale()
  const { home, servicesPage } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-16 sm:py-24">
      <section className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-4xl font-semibold tracking-tight">{home.title}</h1>
        <p className="text-lg text-muted-foreground">{home.intro}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${locale}/services`} className={buttonVariants()}>
            {home.seeServices}
          </Link>
          <Link href={`/${locale}/doctors`} className={buttonVariants({ variant: 'secondary' })}>
            {home.meetDoctors}
          </Link>
        </div>
      </section>

      <section aria-labelledby="home-services" className="flex flex-col gap-6">
        <h2 id="home-services" className="text-2xl font-semibold tracking-tight">
          {home.servicesTitle}
        </h2>
        <Suspense fallback={<ServiceListFallback label={servicesPage.loading} />}>
          <ServiceList
            locale={locale}
            labels={servicesPage}
            limit={FEATURED_SERVICES}
            headingLevel="h3"
          />
        </Suspense>
        <Link
          href={`/${locale}/services`}
          className="inline-flex min-h-11 items-center self-start font-medium text-primary underline underline-offset-4"
        >
          {home.allServices}
        </Link>
      </section>

      <section
        aria-labelledby="home-patients"
        className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
      >
        <h2 id="home-patients" className="text-2xl font-semibold tracking-tight">
          {home.patientsTitle}
        </h2>
        <p className="text-muted-foreground">{home.patientsIntro}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${locale}/register`} className={buttonVariants()}>
            {home.register}
          </Link>
          <Link href={`/${locale}/login`} className={buttonVariants({ variant: 'secondary' })}>
            {home.signIn}
          </Link>
        </div>
      </section>
    </div>
  )
}
