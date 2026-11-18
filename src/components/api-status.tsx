'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/cn'
import { checkApiHealth, selectApiStatus, type ApiStatus } from '@/store/api-status-slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

const dots: Record<ApiStatus, string> = {
  unknown: 'bg-muted-foreground',
  online: 'bg-success',
  offline: 'bg-danger',
}

// Whether the API answers, checked once when the page loads. The text says it, so the color of
// the dot is only a help. It is not a live region: announcing it on every page would be noise
export function ApiStatusIndicator({ labels }: { labels: Record<ApiStatus, string> }) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectApiStatus)

  useEffect(() => {
    void dispatch(checkApiHealth())
  }, [dispatch])

  return (
    <p className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={cn('size-2 rounded-full', dots[status])} />
      {labels[status]}
    </p>
  )
}
