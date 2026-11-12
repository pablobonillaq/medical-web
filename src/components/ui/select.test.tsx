import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Select } from './select'

const services = (
  <>
    <option value="">Elige un servicio</option>
    <option value="general">Consulta general</option>
    <option value="pediatria">Pediatría</option>
  </>
)

describe('Select', () => {
  it('is a native list of options found by its label', async () => {
    const user = userEvent.setup()
    render(<Select label="Servicio">{services}</Select>)

    const select = screen.getByRole('combobox', { name: 'Servicio' })
    await user.selectOptions(select, 'Pediatría')

    expect(select).toHaveValue('pediatria')
    expect(select).not.toHaveAttribute('aria-describedby')
  })

  it('shows a required field with its error and hint', () => {
    render(
      <Select
        label="Servicio"
        required
        hint="Cada servicio dura 30 minutos"
        error="Elige un servicio"
      >
        {services}
      </Select>,
    )

    const select = screen.getByRole('combobox', { name: 'Servicio' })
    expect(select).toBeRequired()
    expect(select).toBeInvalid()
    expect(select).toHaveAccessibleDescription(
      'Error: Elige un servicio Cada servicio dura 30 minutos',
    )
  })
})
