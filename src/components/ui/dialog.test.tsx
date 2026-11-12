import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './dialog'

// The usual use: a button opens the dialog, and the parent keeps the open state
function CancelAppointment({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Cancelar cita
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
          onClose()
        }}
        title="¿Cancelar la cita?"
        description="El horario quedará libre para otro paciente."
      >
        <button type="button" onClick={() => setOpen(false)}>
          Sí, cancelar
        </button>
      </Dialog>
    </>
  )
}

const setup = async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<CancelAppointment onClose={onClose} />)
  await user.click(screen.getByRole('button', { name: 'Cancelar cita' }))
  return { user, onClose, dialog: screen.getByRole('dialog', { name: '¿Cancelar la cita?' }) }
}

describe('Dialog', () => {
  it('opens as a modal named by its title and described by its text', async () => {
    const { dialog } = await setup()

    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAccessibleDescription('El horario quedará libre para otro paciente.')
  })

  it('closes with the ✕ button and tells the parent once', async () => {
    const { user, onClose, dialog } = await setup()

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(dialog).not.toHaveAttribute('open')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes with a click outside, but not with a click inside', async () => {
    const { user, dialog } = await setup()

    await user.click(screen.getByText('El horario quedará libre para otro paciente.'))
    expect(dialog).toHaveAttribute('open')

    await user.click(dialog)
    expect(dialog).not.toHaveAttribute('open')
  })

  it('closes when the parent sets open to false', async () => {
    const { user, dialog } = await setup()

    await user.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

    expect(dialog).not.toHaveAttribute('open')
  })

  it('can start open, with another close label and no description', () => {
    render(
      <Dialog open onClose={vi.fn()} title="Detalles" closeLabel="Close">
        <p>Contenido</p>
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Detalles' })
    expect(dialog).toHaveAttribute('open')
    expect(dialog).not.toHaveAttribute('aria-describedby')
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })
})
