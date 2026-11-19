'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { validateRegistration, type RegisterFieldErrors } from '@/auth/register-schema'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { useFocusFirstInvalid } from '@/lib/use-focus-first-invalid'
import { useHydrated } from '@/lib/use-hydrated'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectSignUpError, selectSigningUp, signUp } from '@/store/session-slice'

type RegisterFormProps = {
  labels: Dictionary['register']
  locale: Locale
}

type TextField = keyof RegisterFieldErrors

// The visitor's date, "2026-11-19", to compare with the birth date (en-CA writes YYYY-MM-DD)
const localToday = () => new Date().toLocaleDateString('en-CA')

export function RegisterForm({ labels, locale }: RegisterFormProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const signingUp = useAppSelector(selectSigningUp)
  const signUpError = useAppSelector(selectSignUpError)
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({})
  const { formRef, focusFirstInvalid } = useFocusFirstInvalid()
  const hydrated = useHydrated()

  // The message of a field's error, in the language of the page
  const errorOf = (field: TextField) => {
    const key = fieldErrors[field]
    return key && (labels.fieldErrors[field] as Record<string, string>)[key]
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (signingUp) return

    const form = new FormData(event.currentTarget)
    const text = (name: TextField) => String(form.get(name))
    const { values, errors } = validateRegistration(
      {
        firstName: text('firstName'),
        lastName: text('lastName'),
        birthDate: text('birthDate'),
        phone: text('phone'),
        email: text('email'),
        password: text('password'),
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

    const result = await dispatch(signUp(values))
    if (signUp.fulfilled.match(result)) {
      // With the session started, to the new account; if signing in failed, to sign in by hand.
      // refresh() renders the server components again, now with the session cookie
      router.replace(`/${locale}/${result.payload === 'signedIn' ? 'account' : 'login'}`)
      router.refresh()
    }
  }

  return (
    // noValidate and method="post", like the sign-in form: our messages, and never a GET
    <form
      ref={formRef}
      method="post"
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
    >
      {signUpError && (
        <Alert variant="danger" title={labels.errorTitle} announce="assertive">
          {labels.errors[signUpError]}
        </Alert>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="firstName"
          label={labels.firstName}
          autoComplete="given-name"
          required
          error={errorOf('firstName')}
        />
        <Input
          name="lastName"
          label={labels.lastName}
          autoComplete="family-name"
          required
          error={errorOf('lastName')}
        />
      </div>
      <Input
        name="birthDate"
        type="date"
        label={labels.birthDate}
        autoComplete="bday"
        required
        error={errorOf('birthDate')}
      />
      <Input
        name="phone"
        type="tel"
        label={labels.phone}
        hint={labels.phoneHint}
        autoComplete="tel-national"
        required
        error={errorOf('phone')}
      />
      <Input
        name="email"
        type="email"
        label={labels.email}
        autoComplete="email"
        required
        error={errorOf('email')}
      />
      <Input
        name="password"
        type="password"
        label={labels.password}
        hint={labels.passwordHint}
        autoComplete="new-password"
        required
        error={errorOf('password')}
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">{labels.reminders}</legend>
        <Checkbox name="emailRemindersOptIn" label={labels.emailReminders} />
        <Checkbox name="whatsappOptIn" label={labels.whatsappReminders} />
      </fieldset>
      {/* Disabled until React hydrates: before that, the browser would submit the form itself */}
      <Button
        type="submit"
        disabled={!hydrated}
        loading={signingUp}
        loadingLabel={labels.submitting}
      >
        {labels.submit}
      </Button>
    </form>
  )
}
