import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input } from './input'

const meta = {
  title: 'UI/Forms/Input',
  component: Input,
  args: { label: 'Correo', type: 'email', placeholder: 'luz@correo.test' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithHint: Story = { args: { hint: 'Lo usamos para los recordatorios de tus citas' } }

export const Required: Story = { args: { required: true } }

// Screen readers hear: "Correo, required, invalid entry, Error: Escribe un correo válido…"
export const WithError: Story = {
  args: {
    required: true,
    defaultValue: 'luz@',
    hint: 'Lo usamos para los recordatorios de tus citas',
    error: 'Escribe un correo válido, por ejemplo luz@correo.test',
  },
}

export const Disabled: Story = { args: { disabled: true, defaultValue: 'luz@correo.test' } }
