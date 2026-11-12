import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { controlVariants, describedBy, Field, useFieldIds } from './field'

type InputProps = Omit<ComponentProps<'input'>, 'children'> & {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export function Input({ label, hint, error, id, required, className, ...props }: InputProps) {
  const ids = useFieldIds(id)

  return (
    <Field ids={ids} label={label} hint={hint} error={error} required={required}>
      <input
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
