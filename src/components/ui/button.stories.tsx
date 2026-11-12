import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Reservar cita', onClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger', 'ghost'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = { args: { variant: 'secondary', children: 'Ver horarios' } }

export const Danger: Story = { args: { variant: 'danger', children: 'Cancelar cita' } }

export const Ghost: Story = { args: { variant: 'ghost', children: 'Volver' } }

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Pequeño
      </Button>
      <Button {...args} size="md">
        Mediano
      </Button>
      <Button {...args} size="lg">
        Grande
      </Button>
    </div>
  ),
}

// Keeps the focus and ignores clicks; screen readers hear "Guardar (cargando)"
export const Loading: Story = { args: { loading: true, children: 'Guardar' } }

export const Disabled: Story = { args: { disabled: true } }
