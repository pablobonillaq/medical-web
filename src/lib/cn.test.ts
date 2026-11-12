import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins classes and skips the false ones', () => {
    expect(cn('rounded-md', false, undefined, 'font-medium')).toBe('rounded-md font-medium')
  })

  it('keeps the last class when two set the same property', () => {
    expect(cn('px-4 bg-primary', 'px-6 bg-danger')).toBe('px-6 bg-danger')
  })

  it('tells text sizes and text colors apart, also for the design tokens', () => {
    expect(cn('text-sm text-foreground', 'text-muted-foreground')).toBe(
      'text-sm text-muted-foreground',
    )
  })
})
