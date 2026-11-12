import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Badge } from './badge'
import { buttonVariants } from './button'
import { Card, CardDescription, CardTitle } from './card'

const meta = {
  title: 'UI/Card',
  component: Card,
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Service: Story = {
  render: () => (
    <Card className="w-80">
      <CardTitle>Consulta general</CardTitle>
      <CardDescription>Revisión médica completa · 30 minutos</CardDescription>
    </Card>
  ),
}

export const Appointment: Story = {
  render: () => (
    <Card className="flex w-96 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle as="h3">Martes 10 de noviembre, 09:30</CardTitle>
          <CardDescription>Dra. Ana Garay · Consulta general</CardDescription>
        </div>
        <Badge variant="primary">Confirmada</Badge>
      </div>
      <a href="#reprogramar" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
        Reprogramar
      </a>
    </Card>
  ),
}
