import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SkipLink } from './skip-link'

describe('SkipLink', () => {
  it('points to the main content by default', () => {
    render(<SkipLink />)

    expect(screen.getByRole('link', { name: 'Saltar al contenido principal' })).toHaveAttribute(
      'href',
      '#main-content',
    )
  })

  it('accepts another target and text', () => {
    render(<SkipLink href="#results">Ir a los resultados</SkipLink>)

    expect(screen.getByRole('link', { name: 'Ir a los resultados' })).toHaveAttribute(
      'href',
      '#results',
    )
  })

  it('is the first thing the keyboard reaches', async () => {
    const user = userEvent.setup()
    render(
      <>
        <SkipLink />
        <button type="button">Servicios</button>
      </>,
    )

    await user.tab()

    expect(screen.getByRole('link', { name: 'Saltar al contenido principal' })).toHaveFocus()
  })
})
