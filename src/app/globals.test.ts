import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// The color tokens from globals.css: --color-name: light-dark(#light, #dark).
// The path starts at the project root, where Vitest runs (import.meta.url is not a file URL in jsdom)
const css = readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8')
const tokens = new Map(
  [...css.matchAll(/--color-([a-z-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/g)].map(
    ([, name, light, dark]) => [name, { light, dark }],
  ),
)

// WCAG 2.2 relative luminance and contrast ratio
const luminance = (hex: string) => {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: string, b: string) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

// [foreground, background, minimum]: 4.5:1 for text, 3:1 for borders and the focus ring
const PAIRS: [string, string, number][] = [
  ['foreground', 'background', 4.5],
  ['foreground', 'surface', 4.5],
  ['muted-foreground', 'background', 4.5],
  ['muted-foreground', 'surface', 4.5],
  ['primary', 'background', 4.5],
  ['primary', 'surface', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['danger', 'surface', 4.5],
  ['danger-foreground', 'danger', 4.5],
  ['success', 'surface', 4.5],
  ['warning', 'surface', 4.5],
  ['input', 'background', 3],
  ['input', 'surface', 3],
  ['ring', 'background', 3],
  ['ring', 'surface', 3],
]

describe('color tokens', () => {
  describe.each(['light', 'dark'] as const)('%s theme', (theme) => {
    it.each(PAIRS)('%s on %s has at least %s:1 contrast', (front, back, minimum) => {
      const foreground = tokens.get(front)?.[theme]
      const background = tokens.get(back)?.[theme]
      if (!foreground || !background) throw new Error(`Missing token: ${front} or ${back}`)

      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum)
    })
  })
})
