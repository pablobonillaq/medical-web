import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SkipLink } from './skip-link'

const meta = {
  title: 'UI/SkipLink',
  component: SkipLink,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <>
      <SkipLink {...args} />
      <main id="main-content" tabIndex={-1} className="p-8 focus:outline-none">
        <p>Presiona Tab: el enlace aparece arriba a la izquierda.</p>
      </main>
    </>
  ),
} satisfies Meta<typeof SkipLink>

export default meta
type Story = StoryObj<typeof meta>

export const Hidden: Story = {}

// The play function presses Tab, the way a keyboard user arrives at the page
export const Focused: Story = {
  play: async ({ userEvent }) => {
    await userEvent.tab()
  },
}
