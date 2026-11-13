import { getDictionary } from '@/i18n/dictionaries'

export default async function HomePage() {
  const { home } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">{home.title}</h1>
      <p className="text-lg text-muted-foreground">{home.intro}</p>
    </div>
  )
}
