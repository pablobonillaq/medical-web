import type { Metadata } from 'next'
import { LoginForm } from '@/components/login-form'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { login } = await getDictionary()
  return { title: login.title }
}

// The form reads ?next= only when it submits, in the browser, so the page needs no request
// data and stays in the static shell
export default async function LoginPage() {
  const locale = await getLocale()
  const { login } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{login.title}</h1>
        <p className="text-muted-foreground">{login.intro}</p>
      </div>
      <LoginForm labels={login} locale={locale} />
    </div>
  )
}
