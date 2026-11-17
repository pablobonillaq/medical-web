'use client'

import { THEME_PREFERENCES, type ThemePreference } from '@/theme/theme'
import { useTheme } from '@/theme/use-theme'
import { useHydrated } from '@/lib/use-hydrated'

export type ThemeSwitcherLabels = Record<ThemePreference, string> & { legend: string }

// Native radio buttons: screen readers announce "Tema, Claro, radio button, 1 of 3", and the
// arrow keys move between the options, with no extra JavaScript. The texts come from the page,
// in its language
export function ThemeSwitcher({ labels }: { labels: ThemeSwitcherLabels }) {
  const [theme, setTheme] = useTheme()

  const hydrated = useHydrated()

  // Disabled until React hydrates. Otherwise a click that comes first checks the radio button
  // without running onChange: the theme does not change, and clicking that option again does
  // nothing, because the browser already shows it checked
  return (
    <fieldset disabled={!hydrated}>
      <legend className="mb-1 text-sm font-medium">{labels.legend}</legend>
      <div className="inline-flex gap-1 rounded-lg border border-input bg-surface p-1">
        {THEME_PREFERENCES.map((option) => (
          <label
            key={option}
            className="cursor-pointer rounded-md px-3 py-1.5 text-sm has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring has-disabled:cursor-default"
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
            {labels[option]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
