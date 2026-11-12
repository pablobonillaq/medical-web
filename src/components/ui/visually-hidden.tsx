import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

// Text that screen readers read but that is not shown, e.g. a label for an icon-only button
export function VisuallyHidden({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('sr-only', className)} {...props} />
}
