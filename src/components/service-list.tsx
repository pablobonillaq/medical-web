import { CATALOG_LANGUAGE, getServices } from '@/catalog/catalog'
import { Alert } from '@/components/ui/alert'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'

type ServiceListProps = {
  locale: Locale
  labels: Dictionary['servicesPage']
}

// The clinic's services, one card each. The list comes from the API, so the page puts it
// behind <Suspense>
export async function ServiceList({ locale, labels }: ServiceListProps) {
  const services = await getServices()

  if (!services) {
    return (
      <Alert variant="warning" title={labels.unavailableTitle}>
        {labels.unavailable}
      </Alert>
    )
  }
  if (services.length === 0) return <p className="text-muted-foreground">{labels.empty}</p>

  // "30 minutos", "30 minutes"
  const duration = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'long',
  })
  const catalogLang = locale === CATALOG_LANGUAGE ? undefined : CATALOG_LANGUAGE

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {services.map((service) => (
        <li key={service.id}>
          <Card className="flex h-full flex-col">
            <CardTitle lang={catalogLang}>{service.name}</CardTitle>
            {service.description && (
              <CardDescription lang={catalogLang}>{service.description}</CardDescription>
            )}
            <p className="mt-auto pt-4 text-sm">
              <span className="text-muted-foreground">{labels.duration}:</span>{' '}
              {duration.format(service.durationMinutes)}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  )
}

// aria-busy and a text for screen readers say that the services are loading
export function ServiceListFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="grid gap-4 sm:grid-cols-2">
      <VisuallyHidden>{label}</VisuallyHidden>
      {[1, 2].map((key) => (
        <Skeleton key={key} className="h-32" />
      ))}
    </div>
  )
}
