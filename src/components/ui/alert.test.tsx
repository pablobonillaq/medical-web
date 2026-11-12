import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert } from './alert'

describe('Alert', () => {
  it('shows a title and a message, as plain content by default', () => {
    render(<Alert title="Recuerda">Llega 10 minutos antes de tu cita.</Alert>)

    expect(screen.getByText('Recuerda')).toHaveClass('text-primary')
    expect(screen.getByText('Llega 10 minutos antes de tu cita.')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('announces a success politely', () => {
    render(<Alert variant="success" title="Cita reservada" announce="polite" />)

    expect(screen.getByRole('status')).toHaveTextContent('Cita reservada')
    expect(screen.getByText('Cita reservada')).toHaveClass('text-success')
  })

  it('interrupts the screen reader only for errors', () => {
    render(
      <Alert variant="danger" announce="assertive">
        No pudimos guardar los cambios.
      </Alert>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos guardar los cambios.')
    expect(screen.getByRole('alert')).toHaveClass('border-l-danger')
  })
})
