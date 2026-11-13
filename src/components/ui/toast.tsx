'use client'

import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { VisuallyHidden } from './visually-hidden'

type ToastVariant = 'info' | 'success' | 'danger'

type ToastMessage = {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

export type ToastInput = Omit<ToastMessage, 'id' | 'variant'> & { variant?: ToastVariant }

// Long enough to read a short message. The time stops while the pointer or the focus is on it
export const TOAST_DURATION_MS = 8000

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)

// Shows a short message after an action ("Cita reservada"). Use it inside <ToastProvider>
export const useToast = () => {
  const showToast = use(ToastContext)
  if (!showToast) throw new Error('useToast must be used inside <ToastProvider>')
  return showToast
}

const accents: Record<ToastVariant, string> = {
  info: 'border-l-primary',
  success: 'border-l-success',
  danger: 'border-l-danger',
}

type ToastProviderProps = {
  children: ReactNode
  // The name of the ✕ button of every toast
  closeLabel?: string
}

// The two live regions are always on the page, even when empty: screen readers only announce
// what is added to a region they already know. Errors go to the assertive one and interrupt;
// the rest wait until the screen reader is quiet.
export function ToastProvider({ children, closeLabel = 'Cerrar aviso' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const lastId = useRef(0)

  const showToast = useCallback((toast: ToastInput) => {
    lastId.current += 1
    const id = lastId.current
    setToasts((current) => [...current, { variant: 'info', ...toast, id }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const renderToasts = (list: ToastMessage[]) =>
    list.map((toast) => (
      <ToastItem key={toast.id} toast={toast} closeLabel={closeLabel} onDismiss={dismiss} />
    ))
  return (
    <ToastContext value={showToast}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto">
        <div role="status" className="flex w-full max-w-sm flex-col gap-2">
          {renderToasts(toasts.filter((toast) => toast.variant !== 'danger'))}
        </div>
        <div role="alert" className="flex w-full max-w-sm flex-col gap-2">
          {renderToasts(toasts.filter((toast) => toast.variant === 'danger'))}
        </div>
      </div>
    </ToastContext>
  )
}

type ToastItemProps = {
  toast: ToastMessage
  onDismiss: (id: number) => void
  closeLabel: string
}

function ToastItem({ toast, closeLabel, onDismiss }: ToastItemProps) {
  const [paused, setPaused] = useState(false)
  // Errors stay until they are closed: there is no time limit to read them (WCAG 2.2.1)
  const autoDismiss = toast.variant !== 'danger'

  useEffect(() => {
    if (!autoDismiss || paused) return
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [autoDismiss, paused, onDismiss, toast.id])

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-md border border-l-4 border-border bg-surface p-4 shadow-lg',
        accents[toast.variant],
      )}
    >
      <div className="flex-1">
        <p className="font-semibold">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-m-2 inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background"
      >
        <span aria-hidden="true">✕</span>
        <VisuallyHidden>{closeLabel}</VisuallyHidden>
      </button>
    </div>
  )
}
