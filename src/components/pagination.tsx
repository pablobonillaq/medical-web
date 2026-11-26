import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

// ?page= as a page number: a whole number from 1 on, or else the first page
export const pageParam = (value: string | string[] | undefined) =>
  typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : 1

type PaginationProps = {
  // The page without ?page=, e.g. "/es/appointments"
  path: string
  // The rest of the query, kept on every page, e.g. { search: 'ortega' }
  query?: Record<string, string>
  // Names the navigation for screen readers: "Páginas de tus citas anteriores"
  label: string
  page: number
  pageSize: number
  total: number
  // "Más recientes" and "Más antiguas", and "Página {page} de {pages}"
  previous: string
  next: string
  pageOf: string
}

// Links to the page before and after, in the URL, so they work without JavaScript and keep
// their place in the history. Nothing when everything fits on one page
export function Pagination({
  path,
  query,
  label,
  page,
  pageSize,
  total,
  previous,
  next,
  pageOf,
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages === 1) return null

  // The first page has no ?page=, so its address is the same as the page without it
  const href = (to: number) => {
    const params = new URLSearchParams(query)
    if (to > 1) params.set('page', String(to))
    return params.size > 0 ? `${path}?${params}` : path
  }
  const link = buttonVariants({ variant: 'secondary', size: 'sm' })

  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-3">
      {page > 1 && (
        <Link href={href(page - 1)} className={link}>
          {previous}
        </Link>
      )}
      <p className="text-sm text-muted-foreground">
        {pageOf.replace('{page}', String(page)).replace('{pages}', String(pages))}
      </p>
      {page < pages && (
        <Link href={href(page + 1)} className={link}>
          {next}
        </Link>
      )}
    </nav>
  )
}
