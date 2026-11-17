import { renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { useHydrated } from './use-hydrated'

function Probe() {
  return <span>{String(useHydrated())}</span>
}

describe('useHydrated', () => {
  it('is false in the HTML rendered on the server', () => {
    expect(renderToString(<Probe />)).toBe('<span>false</span>')
  })

  it('is true once React runs in the browser', () => {
    expect(renderHook(() => useHydrated()).result.current).toBe(true)
  })
})
