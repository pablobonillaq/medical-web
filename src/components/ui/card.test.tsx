import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card, CardDescription, CardTitle } from './card'

describe('Card', () => {
  it('has an h2 title and a description by default', () => {
    render(
      <Card className="max-w-sm" data-testid="card">
        <CardTitle>Consulta general</CardTitle>
        <CardDescription>30 minutos</CardDescription>
      </Card>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Consulta general' })).toBeInTheDocument()
    expect(screen.getByText('30 minutos')).toHaveClass('text-muted-foreground')
    expect(screen.getByTestId('card')).toHaveClass('bg-surface', 'max-w-sm')
  })

  it('uses the heading level that fits the page', () => {
    render(<CardTitle as="h3">Pediatría</CardTitle>)

    expect(screen.getByRole('heading', { level: 3, name: 'Pediatría' })).toBeInTheDocument()
  })
})
