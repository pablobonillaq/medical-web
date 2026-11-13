import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { es } from '@/i18n/dictionaries/es'
import { en } from '@/i18n/dictionaries/en'
import { ThemeSwitcher } from './theme-switcher'

const meta = {
  title: 'Components/ThemeSwitcher',
  component: ThemeSwitcher,
  args: { labels: es.theme },
} satisfies Meta<typeof ThemeSwitcher>

export default meta
type Story = StoryObj<typeof meta>

// In Storybook the toolbar sets the theme; this story shows the control itself and its focus
export const Default: Story = {}

export const English: Story = {
  args: { labels: en.theme },
}
