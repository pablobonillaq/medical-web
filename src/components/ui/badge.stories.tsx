import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Badge } from './badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  args: { children: 'Programada' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['neutral', 'primary', 'success', 'warning', 'danger'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}

// The appointment statuses of the API, each with its own text
export const AppointmentStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Programada</Badge>
      <Badge variant="primary">Confirmada</Badge>
      <Badge variant="success">Atendida</Badge>
      <Badge variant="warning">No se presentó</Badge>
      <Badge variant="danger">Cancelada</Badge>
    </div>
  ),
}
