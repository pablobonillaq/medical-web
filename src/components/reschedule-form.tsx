'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { useHydrated } from '@/lib/use-hydrated'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  rescheduleAppointment,
  rescheduleErrorCleared,
  selectRescheduleError,
  selectRescheduling,
} from '@/store/reschedule-slice'
import { TimeOptions, type SlotOption } from './time-options'

type RescheduleFormProps = {
  appointmentId: string
  locale: Locale
  labels: Dictionary['reschedulePage']
  // "Horarios disponibles el jueves, 26 de noviembre de 2026"
  legend: string
  slots: SlotOption[]
}

// The last step: one of the free times, and the change itself. Then back to the appointment
export function RescheduleForm({
  appointmentId,
  locale,
  labels,
  legend,
  slots,
}: RescheduleFormProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const showToast = useToast()
  const rescheduling = useAppSelector(selectRescheduling)
  const rescheduleError = useAppSelector(selectRescheduleError)
  const hydrated = useHydrated()
  const [missingTime, setMissingTime] = useState(false)

  // The store lives as long as the tab: an error of an earlier visit does not belong here
  useEffect(() => {
    dispatch(rescheduleErrorCleared())
  }, [dispatch])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (rescheduling) return

    const startsAt = new FormData(event.currentTarget).get('startsAt')
    if (typeof startsAt !== 'string') {
      setMissingTime(true)
      // The first time takes the focus, where the message is read
      event.currentTarget.querySelector<HTMLInputElement>('input[name="startsAt"]')?.focus()
      return
    }
    setMissingTime(false)

    const result = await dispatch(rescheduleAppointment({ id: appointmentId, startsAt }))
    if (rescheduleAppointment.fulfilled.match(result)) {
      showToast({ title: labels.rescheduled, variant: 'success' })
      router.push(`/${locale}/appointments/${appointmentId}`)
    } else if (result.payload === 'slotTaken') {
      // The free times, or the appointment, changed: read them again
      router.refresh()
    }
  }

  return (
    // noValidate and method="post", like the other forms: our messages, and never a GET
    <form method="post" noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      {rescheduleError && (
        <Alert variant="danger" title={labels.errorTitle} announce="assertive">
          {labels.errors[rescheduleError]}
        </Alert>
      )}
      <TimeOptions
        legend={legend}
        note={labels.timeZoneNote}
        error={missingTime ? labels.chooseTime : undefined}
        slots={slots}
      />
      {/* Disabled until React hydrates: before that, the browser would submit the form itself */}
      <Button
        type="submit"
        className="self-start"
        disabled={!hydrated}
        loading={rescheduling}
        loadingLabel={labels.submitting}
      >
        {labels.submit}
      </Button>
    </form>
  )
}
