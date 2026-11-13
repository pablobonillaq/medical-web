import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export default async function HomePage() {
  const locale = await getLocale()
  const { home, theme, language } = await getDictionary()

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">{home.title}</h1>
      <p className="text-lg text-muted-foreground">{home.intro}</p>
      <div className="flex flex-wrap gap-6">
        <ThemeSwitcher labels={theme} />
        <LanguageSwitcher label={language.label} current={locale} />
      </div>
    </main>
  )
}
