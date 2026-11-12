import { ThemeSwitcher } from '@/components/theme-switcher'

export default function HomePage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Clínica</h1>
      <p className="text-lg text-muted-foreground">
        Agenda tus citas, consulta tu expediente y escribe a la recepción desde un solo lugar.
      </p>
      <ThemeSwitcher />
    </main>
  )
}
