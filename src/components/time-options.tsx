import { useId } from 'react'

// A free time, with its label already in the language of the page and the clinic's time zone
export type SlotOption = {
  startsAt: string
  label: string
}

type TimeOptionsProps = {
  // "Horarios disponibles el jueves, 26 de noviembre de 2026"
  legend: string
  // That the times are the clinic's
  note: string
  // Why the patient has to choose again, if they sent the form without a time
  error?: string
  slots: SlotOption[]
}

// The free times as a group of radio buttons named startsAt, shown as buttons. Used to book and
// to move an appointment
export function TimeOptions({ legend, note, error, slots }: TimeOptionsProps) {
  const errorId = useId()
  const noteId = useId()

  return (
    <fieldset
      className="flex flex-col gap-3"
      aria-describedby={[noteId, error ? errorId : null].filter(Boolean).join(' ')}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-1 font-medium">{legend}</legend>
      <p id={noteId} className="text-sm text-muted-foreground">
        {note}
      </p>
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <label
            key={slot.startsAt}
            className="cursor-pointer rounded-md border border-input bg-surface px-4 py-2.5 text-sm font-medium has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
          >
            <input type="radio" name="startsAt" value={slot.startsAt} className="sr-only" />
            {slot.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
