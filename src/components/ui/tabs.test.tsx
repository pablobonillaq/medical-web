import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tabs } from './tabs'

const items: Parameters<typeof Tabs>[0]['items'] = [
  { value: 'upcoming', label: 'Próximas', content: <p>Lunes 10:00 con la Dra. Garay</p> },
  { value: 'past', label: 'Pasadas', content: <p>Sin citas pasadas</p> },
  { value: 'cancelled', label: 'Canceladas', content: <p>Sin citas canceladas</p> },
]

const renderTabs = (defaultValue?: string) =>
  render(<Tabs label="Citas" items={items} defaultValue={defaultValue} />)

describe('Tabs', () => {
  it('names the tab list and selects the first tab', () => {
    renderTabs()

    expect(screen.getByRole('tablist', { name: 'Citas' })).toBeInTheDocument()
    const first = screen.getByRole('tab', { name: 'Próximas' })
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(first).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Pasadas' })).toHaveAttribute('tabindex', '-1')

    const panel = screen.getByRole('tabpanel', { name: 'Próximas' })
    expect(panel).toHaveTextContent('Lunes 10:00 con la Dra. Garay')
    expect(first).toHaveAttribute('aria-controls', panel.id)
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  })

  it('can start on another tab', () => {
    renderTabs('past')

    expect(screen.getByRole('tab', { name: 'Pasadas' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Sin citas pasadas')
  })

  it('shows the panel of the clicked tab', async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.click(screen.getByRole('tab', { name: 'Canceladas' }))

    expect(screen.getByRole('tab', { name: 'Canceladas' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Próximas' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Sin citas canceladas')
  })

  it('moves with the arrow keys and wraps around', async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.tab()
    expect(screen.getByRole('tab', { name: 'Próximas' })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Pasadas' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Sin citas pasadas')

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Canceladas' })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Próximas' })).toHaveFocus()
  })

  it('jumps to the first and last tab with Home and End', async () => {
    const user = userEvent.setup()
    renderTabs('past')

    await user.tab()
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Canceladas' })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Próximas' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Próximas' })).toHaveAttribute('aria-selected', 'true')
  })

  it('ignores other keys and reaches the panel with Tab', async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.tab()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Próximas' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })
})
