'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { cn } from '@/lib/cn'
import {
  checkApiHealth,
  selectApiChecking,
  selectApiStatus,
  type ApiStatus,
} from '@/store/api-status-slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

const dots: Record<ApiStatus, string> = {
  unknown: 'bg-muted-foreground',
  online: 'bg-success',
  offline: 'bg-danger',
}

// Whether the API answers, as the saga in the store finds it. The text says it, so the color
// of the dot is only a help. The status itself is not a live region, since announcing it on
// every page would be noise; a change while the visitor is here is announced with a toast
export function ApiStatusIndicator({ labels }: { labels: Dictionary['apiStatus'] }) {
  const dispatch = useAppDispatch()
  const showToast = useToast()
  const status = useAppSelector(selectApiStatus)
  const checking = useAppSelector(selectApiChecking)
  const previous = useRef(status)

  useEffect(() => {
    const before = previous.current
    previous.current = status
    if (before === 'online' && status === 'offline') {
      showToast({ title: labels.lost, variant: 'danger' })
    }
    if (before === 'offline' && status === 'online') {
      showToast({ title: labels.restored, variant: 'success' })
    }
  }, [status, showToast, labels])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="inline-flex items-center gap-2">
        <span aria-hidden="true" className={cn('size-2 rounded-full', dots[status])} />
        {labels[status]}
      </p>
      {status === 'offline' && (
        <Button
          variant="secondary"
          size="sm"
          loading={checking}
          loadingLabel={labels.unknown}
          onClick={() => {
            void dispatch(checkApiHealth())
          }}
        >
          {labels.retry}
        </Button>
      )}
    </div>
  )
}
