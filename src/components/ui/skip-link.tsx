import type { ReactNode } from 'react'

type SkipLinkProps = {
  // The id of the main content, with #
  href?: string
  children?: ReactNode
}

// The first stop when pressing Tab: keyboard and screen reader users jump past the header and
// the navigation, straight to the main content. Hidden until it gets the focus.
export function SkipLink({
  href = '#main-content',
  children = 'Saltar al contenido principal',
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
    >
      {children}
    </a>
  )
}
