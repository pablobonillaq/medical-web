import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { SiteHeader } from './site-header'
import { SignInLink } from './sign-in-link'

const meta = {
  title: 'Components/SiteHeader',
  component: SiteHeader,
  args: {
    locale: 'es',
    dictionary: es,
    account: <SignInLink locale="es" label={es.account.signIn} />,
  },
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true, navigation: { pathname: '/es' } },
  },
} satisfies Meta<typeof SiteHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Spanish: Story = {}

export const English: Story = {
  args: {
    locale: 'en',
    dictionary: en,
    account: <SignInLink locale="en" label={en.account.signIn} />,
  },
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/en' } },
  },
}
