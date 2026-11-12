import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { VisuallyHidden } from './visually-hidden'

// Also used by links that must look like buttons: <Link className={buttonVariants()}>
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-60 disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'border border-input bg-surface text-foreground hover:bg-background',
        danger: 'bg-danger text-danger-foreground hover:bg-danger/90',
        ghost: 'text-foreground hover:bg-surface',
      },
      // At least 36 px tall: well above the 24 px minimum target size of WCAG 2.2
      size: {
        sm: 'min-h-9 px-3 text-sm',
        md: 'min-h-11 px-4 text-base',
        lg: 'min-h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    // While an action runs: shows a spinner and ignores clicks
    loading?: boolean
    // Read by screen readers next to the text while loading
    loadingLabel?: string
  }

export function Button({
  className,
  variant,
  size,
  loading = false,
  loadingLabel = 'cargando',
  type = 'button',
  onClick,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      // "button" by default, so a button inside a form never submits it by accident
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      // aria-disabled instead of disabled: the button keeps the focus, so keyboard and screen
      // reader users do not lose their place while the action runs
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
      {/* After the text, so screen readers say e.g. "Guardar (cargando)" */}
      {loading && (
        <>
          {' '}
          <VisuallyHidden>({loadingLabel})</VisuallyHidden>
        </>
      )}
    </button>
  )
}
