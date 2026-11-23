import Form from 'next/form'
import { CATALOG_LANGUAGE, getDoctors, getServices, type Doctor } from '@/catalog/catalog'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'

type DoctorDirectoryProps = {
  locale: Locale
  labels: Dictionary['doctorsPage']
  // The query of the page: ?service= is the service chosen in the filter
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// The clinic's doctors, which can be filtered by service. Both lists come from the cache, so a
// filter asks the API nothing: it only picks from the doctors already there. It reads the URL,
// so the page puts it behind <Suspense>
export async function DoctorDirectory({ locale, labels, searchParams }: DoctorDirectoryProps) {
  const [{ service }, doctors, services] = await Promise.all([
    searchParams,
    getDoctors(),
    getServices(),
  ])
  // "?service=" (all services) and repeated values mean no filter
  const serviceId = typeof service === 'string' && service !== '' ? service : undefined

  if (!doctors) {
    return (
      <Alert variant="warning" title={labels.unavailableTitle}>
        {labels.unavailable}
      </Alert>
    )
  }
  if (doctors.length === 0) return <p className="text-muted-foreground">{labels.empty}</p>

  const shown = serviceId
    ? doctors.filter((doctor) => doctor.services.some(({ id }) => id === serviceId))
    : doctors
  const catalogLang = locale === CATALOG_LANGUAGE ? undefined : CATALOG_LANGUAGE
  // "1 médico", "3 médicos": the plural rules of each language
  const count =
    new Intl.PluralRules(locale).select(shown.length) === 'one'
      ? labels.results.one
      : labels.results.other.replace('{count}', String(shown.length))

  return (
    <div className="flex flex-col gap-6">
      {/* Without the services (the API failed for them only), there is nothing to filter by */}
      {services && services.length > 0 && (
        // A GET form: the filter is in the URL, so it can be shared, and works without JavaScript
        <Form action={`/${locale}/doctors`} className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <Select name="service" label={labels.filterLabel} defaultValue={serviceId ?? ''}>
              <option value="">{labels.allServices}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id} lang={catalogLang}>
                  {service.name}
                </option>
              ))}
            </Select>
          </div>
          {/* A plain <button>: <Button> has a click handler, and the children of <Form> (a Client
              Component) are rendered from this Server Component, which cannot pass functions */}
          <button type="submit" className={buttonVariants({ variant: 'secondary' })}>
            {labels.filter}
          </button>
        </Form>
      )}

      {/* Says how many doctors the filter left, also to screen readers */}
      <p role="status" className="text-sm text-muted-foreground">
        {shown.length === 0 ? labels.noMatch : count}
      </p>

      {shown.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {shown.map((doctor) => (
            <li key={doctor.id}>
              <DoctorCard doctor={doctor} labels={labels} catalogLang={catalogLang} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type DoctorCardProps = {
  doctor: Doctor
  labels: Dictionary['doctorsPage']
  catalogLang: string | undefined
}

function DoctorCard({ doctor, labels, catalogLang }: DoctorCardProps) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div>
        <CardTitle>
          {doctor.firstName} {doctor.lastName}
        </CardTitle>
        <CardDescription lang={catalogLang}>{doctor.specialty}</CardDescription>
      </div>
      <p className="text-sm">
        <span className="text-muted-foreground">{labels.license}:</span> {doctor.licenseNumber}
      </p>
      {doctor.services.length > 0 && (
        <ul aria-label={labels.services} className="mt-auto flex flex-wrap gap-2">
          {doctor.services.map((service) => (
            <li key={service.id}>
              <Badge lang={catalogLang}>{service.name}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// aria-busy and a text for screen readers say that the doctors are loading
export function DoctorDirectoryFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="grid gap-4 sm:grid-cols-2">
      <VisuallyHidden>{label}</VisuallyHidden>
      {[1, 2].map((key) => (
        <Skeleton key={key} className="h-40" />
      ))}
    </div>
  )
}
