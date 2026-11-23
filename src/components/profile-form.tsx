'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { useFocusFirstInvalid } from '@/lib/use-focus-first-invalid'
import { useHydrated } from '@/lib/use-hydrated'
import { validateProfile, type ProfileFieldErrors } from '@/patients/profile-schema'
import type { Patient } from '@/patients/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { saveProfile, selectSaveProfileError, selectSavingProfile } from '@/store/profile-slice'

type ProfileFormProps = {
  patient: Patient
  labels: Dictionary['profilePage']
}

type TextField = keyof ProfileFieldErrors

// The visitor's date, "2026-11-19", to compare with the birth date (en-CA writes YYYY-MM-DD)
const localToday = () => new Date().toLocaleDateString('en-CA')

// The patient's profile, ready to change. The fields start with what the API has; after saving,
// the page reads the profile again and this form starts over with it (see ProfileDetails)
export function ProfileForm({ patient, labels }: ProfileFormProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const showToast = useToast()
  const saving = useAppSelector(selectSavingProfile)
  const saveError = useAppSelector(selectSaveProfileError)
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  const { formRef, focusFirstInvalid } = useFocusFirstInvalid()
  const hydrated = useHydrated()

  // The message of a field's error, in the language of the page
  const errorOf = (field: TextField) => {
    const key = fieldErrors[field]
    return key && (labels.fieldErrors[field] as Record<string, string>)[key]
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const form = new FormData(event.currentTarget)
    const text = (name: TextField) => String(form.get(name))
    const { values, errors } = validateProfile(
      {
        firstName: text('firstName'),
        lastName: text('lastName'),
        birthDate: text('birthDate'),
        phone: text('phone'),
        contactEmail: text('contactEmail'),
        emailRemindersOptIn: form.has('emailRemindersOptIn'),
        whatsappOptIn: form.has('whatsappOptIn'),
      },
      localToday(),
    )
    setFieldErrors(errors ?? {})
    if (!values) {
      focusFirstInvalid()
      return
    }

    const result = await dispatch(saveProfile({ patientId: patient.id, values }))
    if (saveProfile.fulfilled.match(result)) {
      showToast({ title: labels.saved, variant: 'success' })
      // Renders the server components again, with the saved profile
      router.refresh()
    }
  }

  return (
    // noValidate and method="post", like the other forms: our messages, and never a GET
    <form
      ref={formRef}
      method="post"
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-6"
    >
      {saveError && (
        <Alert variant="danger" title={labels.errorTitle} announce="assertive">
          {labels.errors[saveError]}
        </Alert>
      )}
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 text-lg font-semibold">{labels.personal}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            name="firstName"
            label={labels.firstName}
            autoComplete="given-name"
            required
            defaultValue={patient.firstName}
            error={errorOf('firstName')}
          />
          <Input
            name="lastName"
            label={labels.lastName}
            autoComplete="family-name"
            required
            defaultValue={patient.lastName}
            error={errorOf('lastName')}
          />
        </div>
        <Input
          name="birthDate"
          type="date"
          label={labels.birthDate}
          autoComplete="bday"
          required
          defaultValue={patient.birthDate}
          error={errorOf('birthDate')}
        />
        <Input
          name="phone"
          type="tel"
          label={labels.phone}
          hint={labels.phoneHint}
          autoComplete="tel-national"
          required
          // The API keeps it as +52 and 10 digits; the field shows the 10 digits people know
          defaultValue={patient.phone.slice(-10)}
          error={errorOf('phone')}
        />
      </fieldset>
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 text-lg font-semibold">{labels.reminders}</legend>
        <Input
          name="contactEmail"
          type="email"
          label={labels.contactEmail}
          hint={labels.contactEmailHint.replace('{email}', patient.email ?? '')}
          autoComplete="email"
          defaultValue={patient.contactEmail ?? ''}
          error={errorOf('contactEmail')}
        />
        <Checkbox
          name="emailRemindersOptIn"
          label={labels.emailReminders}
          defaultChecked={patient.emailRemindersOptIn}
        />
        <Checkbox
          name="whatsappOptIn"
          label={labels.whatsappReminders}
          defaultChecked={patient.whatsappOptIn}
        />
      </fieldset>
      {/* Disabled until React hydrates: before that, the browser would submit the form itself */}
      <Button
        type="submit"
        className="self-start"
        disabled={!hydrated}
        loading={saving}
        loadingLabel={labels.submitting}
      >
        {labels.submit}
      </Button>
    </form>
  )
}
