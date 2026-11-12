import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

const alertVariants = cva('rounded-md border border-l-4 border-border bg-surface p-4', {
  variants: {
    variant: {
      info: 'border-l-primary',
      success: 'border-l-success',
      warning: 'border-l-warning',
      danger: 'border-l-danger',
    },
  },
  defaultVariants: { variant: 'info' },
})

// The title carries the color: every one of these colors passes 4.5:1 on the surface
const titleColors = {
  info: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const

type AlertProps = Omit<ComponentProps<'div'>, 'title' | 'role'> &
  VariantProps<typeof alertVariants> & {
    title?: ReactNode
    // For messages that appear after an action. "polite" waits for the screen reader to finish
    // what it is saying (role="status"); "assertive" interrupts it (role="alert"), only for errors
    announce?: 'polite' | 'assertive'
  }

const ROLES = { polite: 'status', assertive: 'alert' } as const

export function Alert({ variant, title, announce, className, children, ...props }: AlertProps) {
  const role = announce && ROLES[announce]

  return (
    <div role={role} className={cn(alertVariants({ variant }), className)} {...props}>
      {title && <p className={cn('font-semibold', titleColors[variant ?? 'info'])}>{title}</p>}
      {children && <div className="mt-1 text-sm">{children}</div>}
    </div>
  )
}
