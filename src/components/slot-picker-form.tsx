'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { useHydrated } from '@/lib/use-hydrated'
import { bookAppointment, selectBookError, selectBooking } from '@/store/booking-slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { TimeOptions, type SlotOption } from './time-options'

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
      <TimeOptions
        legend={legend}
        note={labels.timeZoneNote}
        error={missingTime ? labels.chooseTime : undefined}
        slots={slots}
      />
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
