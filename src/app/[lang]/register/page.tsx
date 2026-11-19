import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/register-form'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { register } = await getDictionary()
  return { title: register.title }
}

// Patients create their own account; staff accounts are created by an admin
export default async function RegisterPage() {
  const locale = await getLocale()
  const { register } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{register.title}</h1>
        <p className="text-muted-foreground">{register.intro}</p>
      </div>
      <RegisterForm labels={register} locale={locale} />
      <p className="text-sm">
        {register.haveAccount}{' '}
        <Link href={`/${locale}/login`} className="font-medium text-primary underline">
          {register.signIn}
        </Link>
      </p>
    </div>
  )
}
