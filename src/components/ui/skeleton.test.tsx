import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('is hidden from screen readers and takes its size from the classes', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />)

    const skeleton = container.firstElementChild
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    expect(skeleton).toHaveClass('animate-pulse', 'h-4', 'w-32')
  })
})
