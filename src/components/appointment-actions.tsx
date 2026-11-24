'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, type FormEvent } from 'react'
import type { PatientActions } from '@/appointments/rules'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import type { Dictionary } from '@/i18n/dictionaries/es'
import {
  cancelAppointment,
  changeErrorCleared,
  confirmAppointment,
  selectChangeError,
  selectChanging,
} from '@/store/appointment-changes-slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

type AppointmentActionsProps = {
  appointmentId: string
  // What the patient may do now (see patientActions), decided on the server
  actions: PatientActions
  labels: Dictionary['appointmentPage']
  // "jueves, 26 de noviembre de 2026" and "9:00", for the cancel dialog
  date: string
  time: string
}

// Confirm or cancel the appointment; the page only shows it when one of the actions applies.
// After a change, router.refresh() reads the appointment again from the API, so the status and
// the buttons always show what the API has
export function AppointmentActions({
  appointmentId,
  actions,
  labels,
  date,
  time,
}: AppointmentActionsProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const showToast = useToast()
  const changing = useAppSelector(selectChanging)
  const changeError = useAppSelector(selectChangeError)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reasonTooShort, setReasonTooShort] = useState(false)
  const formId = useId()

  // The button ignores clicks while it is loading, so it confirms only once
  const onConfirm = async () => {
    const result = await dispatch(confirmAppointment(appointmentId))
    if (confirmAppointment.fulfilled.match(result)) {
      showToast({ title: labels.confirmed, variant: 'success' })
    }
    // On success, and also when the appointment changed elsewhere (409): show what the API has
    if (confirmAppointment.fulfilled.match(result) || result.payload === 'alreadyChanged') {
      router.refresh()
    }
  }

  const openCancel = () => {
    dispatch(changeErrorCleared())
    setReasonTooShort(false)
    setCancelOpen(true)
  }

  const onCancel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (changing) return

    const reason = String(new FormData(event.currentTarget).get('reason')).trim()
    // The API asks for at least 3 characters when there is a reason
    if (reason.length > 0 && reason.length < 3) {
      setReasonTooShort(true)
      return
    }
    setReasonTooShort(false)

    const result = await dispatch(
      cancelAppointment({ id: appointmentId, ...(reason && { reason }) }),
    )
    if (cancelAppointment.fulfilled.match(result)) {
      setCancelOpen(false)
      showToast({ title: labels.cancelled, variant: 'success' })
    }
    if (cancelAppointment.fulfilled.match(result) || result.payload === 'alreadyChanged') {
      router.refresh()
    }
  }

  const errorAlert = changeError && (
    <Alert variant="danger" title={labels.errorTitle} announce="assertive">
      {labels.errors[changeError]}
    </Alert>
  )

  return (
    <section aria-labelledby={`${formId}-title`} className="flex flex-col gap-4">
      <h2 id={`${formId}-title`} className="text-xl font-semibold tracking-tight">
        {labels.actions}
      </h2>
      {!cancelOpen && errorAlert}
      {actions.tooLateToCancel && <p className="text-muted-foreground">{labels.tooLate}</p>}
      <div className="flex flex-wrap gap-3">
        {actions.canConfirm && (
          <Button onClick={onConfirm} loading={changing} loadingLabel={labels.confirming}>
            {labels.confirm}
          </Button>
        )}
        {actions.canCancel && (
          <Button variant="danger" onClick={openCancel} disabled={changing}>
            {labels.cancel}
          </Button>
        )}
      </div>

      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={labels.cancelTitle}
        description={labels.cancelDescription.replace('{date}', date).replace('{time}', time)}
        closeLabel={labels.close}
      >
        <form
          id={formId}
          method="post"
          noValidate
          onSubmit={onCancel}
          className="flex flex-col gap-4"
        >
          {/* The error shows where the patient is: here while the dialog is open */}
          {cancelOpen && errorAlert}
          <Textarea
            name="reason"
            label={labels.cancelReason}
            hint={labels.cancelReasonHint}
            error={reasonTooShort ? labels.reasonTooShort : undefined}
            maxLength={300}
            rows={3}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              {labels.keep}
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={changing}
              loadingLabel={labels.cancelling}
            >
              {labels.confirmCancel}
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  )
}
