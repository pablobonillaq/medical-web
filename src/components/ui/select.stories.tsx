import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Select } from './select'

const meta = {
  title: 'UI/Forms/Select',
  component: Select,
  args: {
    label: 'Servicio',
    children: (
      <>
        <option value="">Elige un servicio</option>
        <option value="general">Consulta general</option>
        <option value="pediatria">Pediatría</option>
        <option value="nutricion">Nutrición</option>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithError: Story = {
  args: { required: true, hint: 'Cada servicio dura 30 minutos', error: 'Elige un servicio' },
}
