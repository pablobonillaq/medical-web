import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Textarea } from './textarea'

const meta = {
  title: 'UI/Forms/Textarea',
  component: Textarea,
  args: { label: 'Motivo de la consulta', hint: 'Máximo 500 caracteres' },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithError: Story = {
  args: { required: true, defaultValue: 'Me', error: 'Escribe al menos 3 caracteres' },
}
