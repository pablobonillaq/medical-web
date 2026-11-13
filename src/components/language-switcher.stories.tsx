import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LanguageSwitcher } from './language-switcher'

const meta = {
  title: 'Components/LanguageSwitcher',
  component: LanguageSwitcher,
  args: { label: 'Idioma', current: 'es' },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/es/citas' } },
  },
} satisfies Meta<typeof LanguageSwitcher>

export default meta
type Story = StoryObj<typeof meta>

export const Spanish: Story = {}

export const English: Story = {
  args: { label: 'Language', current: 'en' },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/en/citas' } },
  },
}
