import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'

const preview: Preview = {
  // A documentation page for every component, built from its stories and its props
  tags: ['autodocs'],
  parameters: {
    // Any axe violation marks the story as failed in the Accessibility panel
    a11y: { test: 'error' },
    layout: 'centered',
  },
  // "Tema" in the toolbar: every story can be seen in the light and the dark theme
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Tema',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Claro' },
          { value: 'dark', title: 'Oscuro' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      // The same attribute the app sets: the tokens in globals.css do the rest
      document.documentElement.dataset.theme = String(context.globals.theme)
      return <Story />
    },
  ],
}

export default preview
