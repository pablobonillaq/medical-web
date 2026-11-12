import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from './input'

describe('Input', () => {
  it('is found by its label and takes what the user types', async () => {
    const user = userEvent.setup()
    render(<Input label="Nombre" />)

    const input = screen.getByRole('textbox', { name: 'Nombre' })
    await user.type(input, 'Luz')

    expect(input).toHaveValue('Luz')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('reads the hint after the label', () => {
    render(<Input label="Correo" type="email" hint="Lo usamos para los recordatorios" />)

    expect(screen.getByRole('textbox', { name: 'Correo' })).toHaveAccessibleDescription(
      'Lo usamos para los recordatorios',
    )
  })

  it('marks a required field, with the star only for sight', () => {
    render(<Input label="Teléfono" required />)

    const input = screen.getByRole('textbox', { name: 'Teléfono' })
    expect(input).toBeRequired()
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })

  it('announces the error first and keeps the hint', () => {
    render(
      <Input
        label="Correo"
        hint="Lo usamos para los recordatorios"
        error="Escribe un correo válido"
      />,
    )

    const input = screen.getByRole('textbox', { name: 'Correo' })
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription(
      'Error: Escribe un correo válido Lo usamos para los recordatorios',
    )
    expect(input).toHaveClass('border-danger')
  })

  it('uses the given id and extra classes', () => {
    render(<Input label="Código postal" id="postal-code" className="max-w-32" />)

    const input = screen.getByRole('textbox', { name: 'Código postal' })
    expect(input).toHaveAttribute('id', 'postal-code')
    expect(input).toHaveClass('max-w-32', 'border-input')
  })

  it('gives each field its own id', () => {
    render(
      <>
        <Input label="Nombre" />
        <Input label="Apellido" />
      </>,
    )

    expect(screen.getByRole('textbox', { name: 'Nombre' }).id).not.toBe(
      screen.getByRole('textbox', { name: 'Apellido' }).id,
    )
  })
})
