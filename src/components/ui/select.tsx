import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { controlVariants, describedBy, Field, useFieldIds } from './field'

type SelectProps = ComponentProps<'select'> & {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

// A native <select>: keyboard, screen readers and phones already know how to use it
export function Select({ label, hint, error, id, required, className, ...props }: SelectProps) {
  const ids = useFieldIds(id)

  return (
    <Field ids={ids} label={label} hint={hint} error={error} required={required}>
      <select
        id={ids.control}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, { hint, error })}
        className={cn(controlVariants({ invalid: Boolean(error) }), 'min-h-11', className)}
        {...props}
      />
    </Field>
  )
}
