import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Card } from './card'
import { Skeleton } from './skeleton'
import { VisuallyHidden } from './visually-hidden'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

// The region says it is loading (aria-busy and a text); the gray blocks are only visual
export const LoadingCard: Story = {
  render: () => (
    <Card aria-busy="true" className="flex w-80 flex-col gap-3">
      <VisuallyHidden>Cargando citas…</VisuallyHidden>
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </Card>
  ),
}
