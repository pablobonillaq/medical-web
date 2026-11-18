import type { Dictionary } from '@/i18n/dictionaries/es'
import { ApiStatusIndicator } from './api-status'

type SiteFooterProps = {
  dictionary: Pick<Dictionary, 'footer' | 'apiStatus'>
}

export function SiteFooter({ dictionary }: SiteFooterProps) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground">
        <p>{dictionary.footer.note}</p>
        <ApiStatusIndicator labels={dictionary.apiStatus} />
      </div>
    </footer>
  )
}
