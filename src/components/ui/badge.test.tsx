import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge, badgeVariants } from './badge'

describe('Badge', () => {
  it('is neutral by default', () => {
    render(<Badge>Programada</Badge>)

    expect(screen.getByText('Programada')).toHaveClass('text-foreground', 'border-input')
  })

  it('applies the variant and extra classes', () => {
    render(
      <Badge variant="success" className="uppercase">
        Confirmada
      </Badge>,
    )

    expect(screen.getByText('Confirmada')).toHaveClass('text-success', 'uppercase')
  })

  it('gives its classes to other elements', () => {
    expect(badgeVariants({ variant: 'danger' })).toContain('text-danger')
  })
})
