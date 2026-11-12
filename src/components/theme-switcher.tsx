'use client'

import { THEME_PREFERENCES, type ThemePreference } from '@/theme/theme'
import { useTheme } from '@/theme/use-theme'

const LABELS: Record<ThemePreference, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
}

// Native radio buttons: screen readers announce "Tema, Claro, radio button, 1 of 3", and the
// arrow keys move between the options, with no extra JavaScript
export function ThemeSwitcher() {
  const [theme, setTheme] = useTheme()

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">Tema</legend>
      <div className="inline-flex gap-1 rounded-lg border border-input bg-surface p-1">
        {THEME_PREFERENCES.map((option) => (
          <label
            key={option}
            className="cursor-pointer rounded-md px-3 py-1.5 text-sm has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
          >
            <input
              type="radio"
              name="theme"
              value={option}
              checked={theme === option}
              onChange={() => {
                setTheme(option)
              }}
              className="sr-only"
            />
            {LABELS[option]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
