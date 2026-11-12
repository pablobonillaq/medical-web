import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Alert } from './alert'

const meta = {
  title: 'UI/Alert',
  component: Alert,
  args: { title: 'Recuerda', children: 'Llega 10 minutos antes de tu cita.' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {}

// After an action: role="status", read when the screen reader finishes what it is saying
export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Cita reservada',
    children: 'Te enviamos un recordatorio un día antes.',
    announce: 'polite',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Faltan menos de 2 horas',
    children: 'Para cancelar ahora, llama a la recepción.',
  },
}

// role="alert" interrupts the screen reader: only for errors
export const Danger: Story = {
  args: {
    variant: 'danger',
    title: 'No pudimos guardar los cambios',
    children: 'Revisa tu conexión e inténtalo de nuevo.',
    announce: 'assertive',
  },
}
