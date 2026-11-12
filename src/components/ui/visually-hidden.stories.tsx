import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { buttonVariants } from './button'
import { VisuallyHidden } from './visually-hidden'

const meta = {
  title: 'UI/VisuallyHidden',
  component: VisuallyHidden,
} satisfies Meta<typeof VisuallyHidden>

export default meta
type Story = StoryObj<typeof meta>

// An icon-only button: sighted users see ✕, screen readers hear "Cerrar"
export const IconButtonLabel: Story = {
  args: { children: 'Cerrar' },
  render: (args) => (
    <button type="button" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
      <span aria-hidden="true">✕</span>
      <VisuallyHidden {...args} />
    </button>
  ),
}
