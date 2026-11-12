import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Checkbox } from './checkbox'

const meta = {
  title: 'UI/Forms/Checkbox',
  component: Checkbox,
  args: { label: 'Recibir recordatorios por correo' },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Checked: Story = { args: { defaultChecked: true } }

export const WithHint: Story = {
  args: { hint: 'Te escribimos un día antes de cada cita. Puedes cambiarlo cuando quieras.' },
}

export const WithError: Story = {
  args: {
    label: 'Acepto el aviso de privacidad',
    required: true,
    error: 'Acepta el aviso para crear tu cuenta',
  },
}
