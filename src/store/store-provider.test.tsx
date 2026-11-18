import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { selectApiStatus } from './api-status-slice'
import { useAppStore } from './hooks'
import type { AppStore } from './store'
import { StoreProvider } from './store-provider'

// Remembers the store each render of the provider gives to its children
const stores: AppStore[] = []
function StoreProbe() {
  stores.push(useAppStore())
  return null
}

describe('StoreProvider', () => {
  it('keeps the same store across re-renders', () => {
    stores.length = 0
    const { rerender } = render(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    )
    rerender(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    )

    expect(stores).toHaveLength(2)
    expect(stores[1]).toBe(stores[0])
  })

  it('creates a new store for each page, never a shared one', () => {
    stores.length = 0
    render(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    )
    render(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    )

    expect(stores[1]).not.toBe(stores[0])
  })

  it('starts the sagas in the browser and stops them when the page goes away', async () => {
    stores.length = 0
    const removeListener = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    )

    // The saga that watches the API made its first check
    await waitFor(() => {
      expect(selectApiStatus(stores[0].getState())).toBe('online')
    })

    unmount()
    expect(removeListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })
})
