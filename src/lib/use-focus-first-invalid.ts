import { useEffect, useRef, useState } from 'react'

// After a submit with errors, moves the focus to the first field to fix (WCAG 3.3.1). The
// counter changes on every call, so the focus moves even when the errors are the same as before
export function useFocusFirstInvalid() {
  const formRef = useRef<HTMLFormElement>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (attempt === 0) return
    const form = formRef.current as HTMLFormElement
    // There is always one: the form only calls focusFirstInvalid when a field has an error
    const firstInvalid = form.querySelector('[aria-invalid="true"]') as HTMLElement
    firstInvalid.focus()
  }, [attempt])

  return { formRef, focusFirstInvalid: () => setAttempt((current) => current + 1) }
}
