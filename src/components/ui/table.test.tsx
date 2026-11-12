import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'

const renderAppointments = () =>
  render(
    <Table caption="Citas de hoy">
      <TableHead>
        <TableRow>
          <TableHeader>Hora</TableHeader>
          <TableHeader>Paciente</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableHeader scope="row">09:00</TableHeader>
          <TableCell>Luz Méndez</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  )

describe('Table', () => {
  it('is named by its caption', () => {
    renderAppointments()

    const table = screen.getByRole('table', { name: 'Citas de hoy' })
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2)
    expect(within(table).getByRole('rowheader', { name: '09:00' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: 'Luz Méndez' })).toBeInTheDocument()
  })

  it('can be scrolled with the keyboard on narrow screens', async () => {
    const user = userEvent.setup()
    renderAppointments()

    await user.tab()

    expect(screen.getByRole('region', { name: 'Citas de hoy' })).toHaveFocus()
  })
})
