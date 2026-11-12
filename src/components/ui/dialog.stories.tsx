import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Button } from './button'
import { Dialog } from './dialog'

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  args: {
    open: false,
    onClose: () => {},
    title: '¿Cancelar la cita?',
    description: 'El horario quedará libre para otro paciente.',
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

// Tab stays inside the dialog, Escape closes it and the focus goes back to "Cancelar cita"
export const Default: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    const close = () => setOpen(false)
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Cancelar cita
        </Button>
        <Dialog {...args} open={open} onClose={close}>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Volver
            </Button>
            <Button variant="danger" onClick={close}>
              Sí, cancelar
            </Button>
          </div>
        </Dialog>
      </>
    )
  },
}
