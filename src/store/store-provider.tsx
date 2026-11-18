'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from './store'

// The store lives in Client Components only. useState creates it once per page load and keeps
// the same store across re-renders. Data loaded on the server reaches components as props
export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore)

  // The sagas run in the browser only, and stop when the page goes away
  useEffect(() => {
    const task = store.runSagas()
    return () => {
      task.cancel()
    }
  }, [store])

  return <Provider store={store}>{children}</Provider>
}
