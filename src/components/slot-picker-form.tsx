'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { useHydrated } from '@/lib/use-hydrated'
import { bookAppointment, selectBookError, selectBooking } from '@/store/booking-slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

// A free time, with its label already in the language of the page and the clinic's time zone
export type SlotOption = {
  startsAt: string
  label: string
}

type SlotPickerFormProps = {
  locale: Locale
  labels: Dictionary['bookingPage']
  doctorId: string
  serviceId: string
  // "Horarios disponibles el jueves, 26 de noviembre de 2026"
  legend: string
  slots: SlotOption[]
}

// The last step: one of the free times, optional notes, and the booking itself
export function SlotPickerForm({
  locale,
  labels,
  doctorId,
  serviceId,
  legend,
  slots,
}: SlotPickerFormProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const showToast = useToast()
  const booking = useAppSelector(selectBooking)
  const bookError = useAppSelector(selectBookError)
  const hydrated = useHydrated()
  const [missingTime, setMissingTime] = useState(false)
  const errorId = useId()
  const noteId = useId()

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (booking) return

    const form = new FormData(event.currentTarget)
    const startsAt = form.get('startsAt')
    if (typeof startsAt !== 'string') {
      setMissingTime(true)
      // The first time takes the focus, where the message is read
      event.currentTarget.querySelector<HTMLInputElement>('input[name="startsAt"]')?.focus()
      return
    }
    setMissingTime(false)

    const notes = String(form.get('notes')).trim()
    const result = await dispatch(
      bookAppointment({ doctorId, serviceId, startsAt, ...(notes && { notes }) }),
    )
    if (bookAppointment.fulfilled.match(result)) {
      showToast({ title: labels.booked, variant: 'success' })
      router.push(`/${locale}/appointments/${result.payload.id}`)
    } else if (result.payload === 'slotTaken') {
      // The free times changed: read them again
      router.refresh()
    }
  }

  return (
    // noValidate and method="post", like the other forms: our messages, and never a GET
    <form method="post" noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      {bookError && (
        <Alert variant="danger" title={labels.errorTitle} announce="assertive">
          {labels.errors[bookError]}
        </Alert>
      )}
      <fieldset
        className="flex flex-col gap-3"
        aria-describedby={[noteId, missingTime ? errorId : null].filter(Boolean).join(' ')}
        aria-invalid={missingTime || undefined}
      >
        <legend className="mb-1 font-medium">{legend}</legend>
        <p id={noteId} className="text-sm text-muted-foreground">
          {labels.timeZoneNote}
        </p>
        {missingTime && (
          <p id={errorId} className="text-sm font-medium text-danger">
            {labels.chooseTime}
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
      <Textarea
        name="notes"
        label={labels.notes}
        hint={labels.notesHint}
        maxLength={500}
        rows={3}
      />
      {/* Disabled until React hydrates: before that, the browser would submit the form itself */}
      <Button
        type="submit"
        className="self-start"
        disabled={!hydrated}
        loading={booking}
        loadingLabel={labels.submitting}
      >
        {labels.submit}
      </Button>
    </form>
  )
}
