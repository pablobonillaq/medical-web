import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

// Shown inside the layout, in the language of the URL, when a page calls forbidden(): the
// visitor is signed in, but their role may not see the page. Next.js answers 403
export default async function Forbidden() {
  const locale = await getLocale()
  const { forbidden } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <p className="text-sm font-semibold text-primary">403</p>
      <h1 className="text-3xl font-semibold tracking-tight">{forbidden.title}</h1>
      <p className="text-lg text-muted-foreground">{forbidden.description}</p>
      <Link href={`/${locale}`} className={buttonVariants({ className: 'self-start' })}>
        {forbidden.home}
      </Link>
    </div>
  )
}
