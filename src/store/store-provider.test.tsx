import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
