'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { validateLogin, type LoginFieldErrors } from '@/auth/login-schema'
import { safeRedirectPath } from '@/auth/redirect'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFocusFirstInvalid } from '@/lib/use-focus-first-invalid'
import { useHydrated } from '@/lib/use-hydrated'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectSignInError, selectSigningIn, signIn } from '@/store/session-slice'

type LoginFormProps = {
  labels: Dictionary['login']
  locale: Locale
}

export function LoginForm({ labels, locale }: LoginFormProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const signingIn = useAppSelector(selectSigningIn)
  const signInError = useAppSelector(selectSignInError)
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const { formRef, focusFirstInvalid } = useFocusFirstInvalid()
  const hydrated = useHydrated()

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (signingIn) return

    const form = new FormData(event.currentTarget)
    const { values, errors } = validateLogin({
      email: String(form.get('email')),
      password: String(form.get('password')),
    })
    setFieldErrors(errors ?? {})
    if (!values) {
      focusFirstInvalid()
      return
    }

    const result = await dispatch(signIn(values))
    if (signIn.fulfilled.match(result)) {
      // Back to the page that asked for the session. refresh() renders the server components
      // again, now with the session cookie
      const next = new URLSearchParams(window.location.search).get('next')
      router.replace(safeRedirectPath(next, locale))
      router.refresh()
    }
  }

  return (
    // noValidate: the browser's own messages are replaced by ours, in the language of the page.
    // method="post": if the browser ever submitted it by itself, the password would not end up
    // in the address bar, the history or the server logs
    <form
      ref={formRef}
      method="post"
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
    >
      {signInError && (
        <Alert variant="danger" title={labels.errorTitle} announce="assertive">
          {labels.errors[signInError]}
        </Alert>
      )}
      <Input
        name="email"
        type="email"
        label={labels.email}
        autoComplete="email"
        required
        error={fieldErrors.email && labels.fieldErrors.email[fieldErrors.email]}
      />
      <Input
        name="password"
        type="password"
        label={labels.password}
        autoComplete="current-password"
        required
        error={fieldErrors.password && labels.fieldErrors.password[fieldErrors.password]}
      />
      {/* Disabled until React hydrates: before that, the browser would submit the form itself */}
      <Button
        type="submit"
        disabled={!hydrated}
        loading={signingIn}
        loadingLabel={labels.submitting}
      >
        {labels.submit}
      </Button>
    </form>
  )
}
