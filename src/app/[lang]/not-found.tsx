import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

// Shown inside the layout, with the header and in the language of the URL, when a page calls
// notFound() or the address matches no page (see [...rest]/page.tsx)
export default async function NotFound() {
  const locale = await getLocale()
  const { notFound } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">{notFound.title}</h1>
      <p className="text-lg text-muted-foreground">{notFound.description}</p>
      <Link href={`/${locale}`} className={buttonVariants({ className: 'self-start' })}>
        {notFound.home}
      </Link>
    </div>
  )
}
