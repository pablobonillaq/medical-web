import Link from 'next/link'
import { requireSession } from '@/auth/guard'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { CLINIC_TIME_ZONE } from '@/config/clinic'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { getMyAccessLog } from '@/patients/access-log'
import type { AccessLogEntry, AccessLogPage } from '@/patients/types'
import { Pagination, pageParam } from './pagination'

type AccessLogProps = {
  locale: Locale
  labels: Dictionary['accessLogPage']
  roles: Dictionary['account']['roles']
  // ?page=
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const ACCESS_LOG_PAGE_SIZE = 20

// Who of the staff opened or changed the patient's record, the latest first and page by page.
// It reads the session and the URL, so the page puts it behind <Suspense>
export async function AccessLog({ locale, labels, roles, searchParams }: AccessLogProps) {
  await requireSession({ path: '/profile/access-log', roles: ['patient'] })
  const page = pageParam((await searchParams).page)

  let log: AccessLogPage
  try {
    log = await getMyAccessLog({ page, pageSize: ACCESS_LOG_PAGE_SIZE })
  } catch {
    return (
      <Alert variant="warning" title={labels.unavailableTitle}>
        {labels.unavailable}
      </Alert>
    )
  }

  const back = (
    <Link
      href={`/${locale}/profile`}
      className={buttonVariants({ variant: 'secondary', className: 'self-start' })}
    >
      {labels.back}
    </Link>
  )
  if (log.entries.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-muted-foreground">{labels.empty}</p>
        {back}
      </div>
    )
  }

  // "26 nov 2026, 9:05": the moment at the clinic, as each language writes it
  const moment = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: CLINIC_TIME_ZONE,
  })
  // The doctor's name, or the role of other staff, whose names the API keeps private
  const who = ({ actor }: AccessLogEntry) =>
    actor.name ? (
      <>
        {actor.name} <span className="text-muted-foreground">· {roles[actor.role]}</span>
      </>
    ) : (
      roles[actor.role]
    )

  return (
    <div className="flex flex-col gap-6">
      <Table caption={labels.caption} aria-describedby="access-log-time-zone">
        <TableHead>
          <TableRow>
            <TableHeader>{labels.when}</TableHeader>
            <TableHeader>{labels.who}</TableHeader>
            <TableHeader>{labels.what}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {log.entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap">
                <time dateTime={entry.createdAt}>{moment.format(new Date(entry.createdAt))}</time>
              </TableCell>
              <TableCell>{who(entry)}</TableCell>
              {/* A denied attempt stands out; the words already say it */}
              <TableCell
                className={entry.action === 'denied' ? 'font-medium text-danger' : undefined}
              >
                {labels.actions[entry.action].replace(
                  '{resource}',
                  labels.resources[entry.resource],
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p id="access-log-time-zone" className="text-sm text-muted-foreground">
        {labels.timeZoneNote}
      </p>
      <Pagination
        path={`/${locale}/profile/access-log`}
        label={labels.pagination}
        page={page}
        pageSize={ACCESS_LOG_PAGE_SIZE}
        total={log.total}
        previous={labels.newer}
        next={labels.older}
        pageOf={labels.pageOf}
      />
      {back}
    </div>
  )
}

// aria-busy and a text for screen readers say that the accesses are loading
export function AccessLogFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
