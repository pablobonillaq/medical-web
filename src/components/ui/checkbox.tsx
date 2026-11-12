import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { describedBy, FieldError, FieldHint, useFieldIds } from './field'

type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

// The box is 20 px, and the label is part of the target: clicking the text also checks it
export function Checkbox({ label, hint, error, id, required, className, ...props }: CheckboxProps) {
  const ids = useFieldIds(id)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <input
          id={ids.control}
          type="checkbox"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, { hint, error })}
          className={cn('mt-0.5 size-5 shrink-0 accent-primary', className)}
          {...props}
        />
        <label htmlFor={ids.control} className="text-base">
          {label}
          {required && (
            <span aria-hidden="true" className="text-danger">
              {' '}
              *
            </span>
          )}
        </label>
      </div>
      {error && <FieldError id={ids.error}>{error}</FieldError>}
      {hint && <FieldHint id={ids.hint}>{hint}</FieldHint>}
    </div>
  )
}
