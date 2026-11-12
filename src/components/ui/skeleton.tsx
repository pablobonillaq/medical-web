import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

// A gray block in place of content that is still loading. It is hidden from screen readers:
// the region that loads says so with aria-busy and a text such as "Cargando citas…"
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-border', className)}
      {...props}
    />
  )
}
