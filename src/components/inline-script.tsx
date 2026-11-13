// A script that runs while the browser parses the HTML, before the first paint (the theme script).
// React warns when a client render produces a <script>, because it would never run. So the
// server renders it as JavaScript and the client as text/plain, which the browser ignores;
// suppressHydrationWarning accepts the different type. The script only runs on the first load,
// which is enough: what it sets on <html> stays across client navigations
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
