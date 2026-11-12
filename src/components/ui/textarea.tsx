import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { controlVariants, describedBy, Field, useFieldIds } from './field'

type TextareaProps = Omit<ComponentProps<'textarea'>, 'children'> & {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export function Textarea({
  label,
  hint,
  error,
  id,
  required,
  rows = 4,
  className,
  ...props
}: TextareaProps) {
  const ids = useFieldIds(id)

  return (
    <Field ids={ids} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={ids.control}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, { hint, error })}
        className={cn(controlVariants({ invalid: Boolean(error) }), 'py-2', className)}
        {...props}
      />
    </Field>
  )
}
