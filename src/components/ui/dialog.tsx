'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { VisuallyHidden } from './visually-hidden'

type DialogProps = {
  open: boolean
  // Called however the dialog closes: the ✕ button, Escape or a click outside
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  closeLabel?: string
  className?: string
  children?: ReactNode
}

// A native <dialog> opened with showModal(). The browser does the hard part: the rest of the page
// becomes inert, the focus stays inside, Escape closes it, and on close the focus returns to the
// button that opened it.
export function Dialog({
  open,
  onClose,
  title,
  description,
  closeLabel = 'Cerrar',
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  // The ref is always set once the dialog is on the page, before effects and events run
  const getDialog = () => ref.current as HTMLDialogElement

  useEffect(() => {
    const dialog = getDialog()
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      // A click on the dimmed area outside lands on the <dialog> itself, not on its content
      onClick={(event) => {
        if (event.target === event.currentTarget) getDialog().close()
      }}
      className={cn(
        'm-auto w-full max-w-lg rounded-lg border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/50',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              getDialog().close()
            }}
            className="-m-2 inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background"
          >
            <span aria-hidden="true">✕</span>
            <VisuallyHidden>{closeLabel}</VisuallyHidden>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
