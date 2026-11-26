import Form from 'next/form'
import { requireSession } from '@/auth/guard'
import { Alert } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { searchPatients } from '@/patients/search'
import type { PatientPage } from '@/patients/types'
import { Pagination, pageParam } from './pagination'

type PatientSearchProps = {
  locale: Locale
  labels: Dictionary['patientsPage']
  // ?search= and ?page=
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const PATIENTS_PAGE_SIZE = 20

// The front desk's patient search: a GET form, so the search is in the URL and the browser's
// back button goes back to the last one; then the matching patients, sorted by last name. It
// reads the session and the URL, so the page puts it behind <Suspense>
export async function PatientSearch({ locale, labels, searchParams }: PatientSearchProps) {
  await requireSession({ path: '/front-desk/patients', roles: ['employee'] })
  const query = await searchParams
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const page = pageParam(query.page)
  // The API needs at least 2 characters; one is a typo more often than a search
  const tooShort = search.length === 1
  const path = `/${locale}/front-desk/patients`

  const form = (
    <Form action={path} role="search" className="flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-96">
        <Input
          type="search"
          name="search"
          label={labels.searchLabel}
          hint={labels.searchHint}
          error={tooShort ? labels.tooShort : undefined}
          defaultValue={search}
          maxLength={100}
          autoComplete="off"
        />
      </div>
      {/* A plain <button>: <Button> has a click handler, which a Server Component cannot pass */}
      <button type="submit" className={buttonVariants({ variant: 'secondary' })}>
        {labels.search}
      </button>
    </Form>
  )
  if (tooShort) return form

  let result: PatientPage
  try {
    result = await searchPatients({
      search: search || undefined,
      page,
      pageSize: PATIENTS_PAGE_SIZE,
    })
  } catch {
    return (
      <div className="flex flex-col gap-6">
        {form}
        <Alert variant="warning" title={labels.unavailableTitle}>
          {labels.unavailable}
        </Alert>
      </div>
    )
  }

  // "1 paciente", "3 pacientes": the plural rules of each language. A status, so screen readers
  // hear how many were found after each search
  const count =
    new Intl.PluralRules(locale).select(result.total) === 'one'
      ? labels.results.one
      : labels.results.other.replace('{count}', String(result.total))
  // "14 mar 1958": a date without time, so in UTC
  const birthDate = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' })

  return (
    <div className="flex flex-col gap-6">
      {form}
      <p role="status" className="text-sm text-muted-foreground">
        {count}
      </p>
      {result.patients.length === 0 ? (
        <p className="text-muted-foreground">
          {search ? labels.noResults.replace('{search}', search) : labels.noPatients}
        </p>
      ) : (
        <Table
          caption={search ? labels.resultsCaption.replace('{search}', search) : labels.allCaption}
        >
          <TableHead>
            <TableRow>
              <TableHeader>{labels.name}</TableHeader>
              <TableHeader>{labels.birthDate}</TableHeader>
              <TableHeader>{labels.phone}</TableHeader>
              <TableHeader>{labels.account}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {result.patients.map((patient) => (
              <TableRow key={patient.id}>
                {/* The name names the row for screen readers */}
                <TableHeader scope="row">
                  {patient.lastName}, {patient.firstName}
                </TableHeader>
                <TableCell className="whitespace-nowrap">
                  {birthDate.format(new Date(`${patient.birthDate}T00:00:00.000Z`))}
                </TableCell>
                <TableCell className="whitespace-nowrap">{patient.phone}</TableCell>
                <TableCell>
                  {patient.hasAccount ? labels.withAccount : labels.withoutAccount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Pagination
        path={path}
        query={search ? { search } : undefined}
        label={labels.pagination}
        page={page}
        pageSize={PATIENTS_PAGE_SIZE}
        total={result.total}
        previous={labels.previous}
        next={labels.next}
        pageOf={labels.pageOf}
      />
    </div>
  )
}

// aria-busy and a text for screen readers say that the patients are loading
export function PatientSearchFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton className="h-11 w-full sm:w-96" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
