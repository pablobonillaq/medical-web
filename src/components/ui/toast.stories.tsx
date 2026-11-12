import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './button'
import { ToastProvider, useToast } from './toast'

function ToastButtons() {
  const showToast = useToast()
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => showToast({ title: 'Recordatorio enviado' })}>
        Info
      </Button>
      <Button
        onClick={() =>
          showToast({
            title: 'Cita reservada',
            description: 'Lunes 10:00 con la Dra. Garay',
            variant: 'success',
          })
        }
      >
        Éxito
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          showToast({
            title: 'No se pudo reservar',
            description: 'Ese horario ya no está disponible.',
            variant: 'danger',
          })
        }
      >
        Error
      </Button>
    </div>
  )
}

const meta = {
  title: 'UI/Toast',
  component: ToastProvider,
  args: { children: <ToastButtons /> },
} satisfies Meta<typeof ToastProvider>

export default meta
type Story = StoryObj<typeof meta>

// Info and success hide after 8 s (not while the pointer or the focus is on them); errors stay
export const Default: Story = {}
