import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-surface p-6 shadow-sm', className)}
      {...props}
    />
  )
}

type CardTitleProps = ComponentProps<'h2'> & {
  // The level depends on where the card is: an h2 under the page h1, an h3 inside a section…
  as?: 'h2' | 'h3' | 'h4'
}

export function CardTitle({ as: Heading = 'h2', className, ...props }: CardTitleProps) {
  return <Heading className={cn('text-lg font-semibold', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('mt-1 text-sm text-muted-foreground', className)} {...props} />
}
