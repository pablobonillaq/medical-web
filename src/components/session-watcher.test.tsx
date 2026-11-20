import { render } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { useAppStore } from '@/store/hooks'
import { selectExpiresAt } from '@/store/session-expiry-slice'
import type { AppStore } from '@/store/store'
import { StoreProvider } from '@/store/store-provider'
import { SessionWatcher } from './session-watcher'

// Keeps the store of the page, to read what the watcher told it
const page: { store?: AppStore } = {}
function StoreProbe() {
  const store = useAppStore()
  useEffect(() => {
    page.store = store
  }, [store])
  return null
}

// An hour from now, like a new session
const expiresAt = new Date(Date.now() + 60 * 60_000).toISOString()

const renderWatcher = (watching: boolean) => (
  <StoreProvider>
    <StoreProbe />
    {watching && <SessionWatcher expiresAt={expiresAt} />}
  </StoreProvider>
)

describe('SessionWatcher', () => {
  it('tells the store when the session ends, and forgets it when it leaves the page', () => {
    const { rerender } = render(renderWatcher(true))
    expect(selectExpiresAt(page.store!.getState())).toBe(expiresAt)

    rerender(renderWatcher(false))
    expect(selectExpiresAt(page.store!.getState())).toBeNull()
  })

  it('renders nothing', () => {
    const { container } = render(renderWatcher(true))

    expect(container).toBeEmptyDOMElement()
  })
})
