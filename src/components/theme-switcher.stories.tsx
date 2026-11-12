import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ThemeSwitcher } from './theme-switcher'

const meta = {
  title: 'Components/ThemeSwitcher',
  component: ThemeSwitcher,
} satisfies Meta<typeof ThemeSwitcher>

export default meta
type Story = StoryObj<typeof meta>

// In Storybook the toolbar sets the theme; this story shows the control itself and its focus
export const Default: Story = {}
