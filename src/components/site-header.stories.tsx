import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { SiteHeader } from './site-header'

const meta = {
  title: 'Components/SiteHeader',
  component: SiteHeader,
  args: { locale: 'es', dictionary: es },
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true, navigation: { pathname: '/es' } },
  },
} satisfies Meta<typeof SiteHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Spanish: Story = {}

export const English: Story = {
  args: { locale: 'en', dictionary: en },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/en' } },
  },
}
