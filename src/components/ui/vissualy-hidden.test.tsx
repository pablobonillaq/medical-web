import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VisuallyHidden } from './visually-hidden'

describe('VisuallyHidden', () => {
  it('hides the text visually but keeps it for screen readers', () => {
    render(
      <button type="button">
        ✕<VisuallyHidden className="whitespace-nowrap">Cerrar</VisuallyHidden>
      </button>,
    )

    expect(screen.getByRole('button', { name: '✕Cerrar' })).toBeInTheDocument()
    expect(screen.getByText('Cerrar')).toHaveClass('sr-only', 'whitespace-nowrap')
  })
})
