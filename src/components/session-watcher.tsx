'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { sessionEnded, sessionStarted } from '@/store/session-expiry-slice'

// Hands the end of the session, read on the server, to the saga that counts down to it. When
// it leaves the page (signed out, or the session is gone), the countdown stops
export function SessionWatcher({ expiresAt }: { expiresAt: string }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(sessionStarted({ expiresAt }))
    return () => {
      dispatch(sessionEnded())
    }
  }, [dispatch, expiresAt])

  return null
}
