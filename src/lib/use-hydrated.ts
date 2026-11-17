import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

// false in the HTML from the server and while React hydrates it, true once the page is
// interactive. Lets a control wait for React instead of losing what the visitor does before
export const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
