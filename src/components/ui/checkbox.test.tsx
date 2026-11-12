import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Checkbox } from './checkbox'

describe('Checkbox', () => {
  it('is checked by clicking the box or its text', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Recibir recordatorios por correo" />)

    const checkbox = screen.getByRole('checkbox', { name: 'Recibir recordatorios por correo' })
    await user.click(screen.getByText('Recibir recordatorios por correo'))
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
    expect(checkbox).not.toHaveAttribute('aria-describedby')
  })

  it('can be checked with the space bar', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Recibir recordatorios por WhatsApp" />)

    await user.tab()
    await user.keyboard(' ')

    expect(
      screen.getByRole('checkbox', { name: 'Recibir recordatorios por WhatsApp' }),
    ).toBeChecked()
  })

  it('shows a required box with its error and hint', () => {
    render(
      <Checkbox
        label="Acepto el aviso de privacidad"
        required
        hint="Puedes leerlo antes de continuar"
        error="Acepta el aviso para crear tu cuenta"
      />,
    )

    const checkbox = screen.getByRole('checkbox', { name: 'Acepto el aviso de privacidad' })
    expect(checkbox).toBeRequired()
    expect(checkbox).toBeInvalid()
    expect(checkbox).toHaveAccessibleDescription(
      'Error: Acepta el aviso para crear tu cuenta Puedes leerlo antes de continuar',
    )
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })
})
