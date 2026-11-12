import { cva } from 'class-variance-authority'
import { useId, type ReactNode } from 'react'
import { VisuallyHidden } from './visually-hidden'

// The ids that tie a control to its label, hint and error message
export type FieldIds = { control: string; hint: string; error: string }

export const useFieldIds = (id?: string): FieldIds => {
  const generated = useId()
  const control = id ?? generated
  return { control, hint: `${control}-hint`, error: `${control}-error` }
}

// Screen readers read the hint and the error after the label: "Correo, required, invalid entry,
// Error: Escribe un correo válido. Lo usamos para los recordatorios"
export const describedBy = (
  ids: FieldIds,
  { hint, error }: { hint?: ReactNode; error?: ReactNode },
) => [error ? ids.error : null, hint ? ids.hint : null].filter(Boolean).join(' ') || undefined

// Shared by Input, Textarea and Select. The border passes 3:1 against the background
export const controlVariants = cva(
  'w-full rounded-md border bg-surface px-3 text-base text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      invalid: { true: 'border-danger', false: 'border-input' },
    },
    defaultVariants: { invalid: false },
  },
)

type FieldProps = {
  ids: FieldIds
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  children: ReactNode
}

// Label on top, then the control, the hint and the error. Used by every form control.
export function Field({ ids, label, hint, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={ids.control} className="text-sm font-medium">
        {label}
        {/* The control has `required`, so screen readers already say it: the star is visual */}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error && <FieldError id={ids.error}>{error}</FieldError>}
      {hint && <FieldHint id={ids.hint}>{hint}</FieldHint>}
    </div>
  )
}

export function FieldHint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm text-muted-foreground">
      {children}
    </p>
  )
}

// Text, not only color, says what is wrong (WCAG 1.4.1). "Error:" is for screen readers.
export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm font-medium text-danger">
      <VisuallyHidden>Error:</VisuallyHidden> {children}
    </p>
  )
}
