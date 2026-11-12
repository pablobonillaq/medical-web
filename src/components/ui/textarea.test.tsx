import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Textarea } from './textarea'

describe('Textarea', () => {
  it('has 4 rows by default and takes several lines', async () => {
    const user = userEvent.setup()
    render(<Textarea label="Motivo de la consulta" />)

    const textarea = screen.getByRole('textbox', { name: 'Motivo de la consulta' })
    await user.type(textarea, 'Dolor de cabeza{Enter}desde ayer')

    expect(textarea).toHaveAttribute('rows', '4')
    expect(textarea).toHaveValue('Dolor de cabeza\ndesde ayer')
  })

  it('shows a required field with its error and hint', () => {
    render(
      <Textarea
        label="Motivo"
        rows={2}
        required
        hint="Máximo 300 caracteres"
        error="Escribe al menos 3 caracteres"
      />,
    )

    const textarea = screen.getByRole('textbox', { name: 'Motivo' })
    expect(textarea).toHaveAttribute('rows', '2')
    expect(textarea).toBeRequired()
    expect(textarea).toBeInvalid()
    expect(textarea).toHaveAccessibleDescription(
      'Error: Escribe al menos 3 caracteres Máximo 300 caracteres',
    )
  })
})
