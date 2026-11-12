import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Tabs } from './tabs'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  args: {
    label: 'Citas',
    items: [
      { value: 'upcoming', label: 'Próximas', content: <p>Lunes 10:00 con la Dra. Garay</p> },
      { value: 'past', label: 'Pasadas', content: <p>Sin citas pasadas</p> },
      { value: 'cancelled', label: 'Canceladas', content: <p>Sin citas canceladas</p> },
    ],
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

// Tab enters the list, the arrows (and Home/End) change the tab, Tab again reaches the panel
export const Default: Story = {}

export const StartsOnAnotherTab: Story = {
  args: { defaultValue: 'past' },
}
