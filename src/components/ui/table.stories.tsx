import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Badge } from './badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'

const meta = {
  title: 'UI/Table',
  component: Table,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const appointments = [
  { time: '09:00', patient: 'Luz Méndez', service: 'Consulta general', status: 'Confirmada' },
  { time: '09:30', patient: 'Rosa Ibarra', service: 'Pediatría', status: 'Programada' },
  { time: '10:00', patient: 'Carlos Soto', service: 'Nutrición', status: 'Programada' },
]

export const DailyAgenda: Story = {
  args: { caption: 'Citas de hoy' },
  render: (args) => (
    <Table {...args}>
      <TableHead>
        <TableRow>
          <TableHeader>Hora</TableHeader>
          <TableHeader>Paciente</TableHeader>
          <TableHeader>Servicio</TableHeader>
          <TableHeader>Estado</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.time}>
            <TableHeader scope="row">{appointment.time}</TableHeader>
            <TableCell>{appointment.patient}</TableCell>
            <TableCell>{appointment.service}</TableCell>
            <TableCell>
              <Badge variant={appointment.status === 'Confirmada' ? 'primary' : 'neutral'}>
                {appointment.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
