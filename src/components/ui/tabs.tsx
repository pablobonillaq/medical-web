'use client'

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type TabItem = {
  value: string
  label: ReactNode
  content: ReactNode
}

type TabsProps = {
  // Names the group of tabs for screen readers
  label: string
  // At least one tab
  items: [TabItem, ...TabItem[]]
  defaultValue?: string
  className?: string
}

// The WAI-ARIA tabs pattern: one Tab stop for the whole tab list, the arrow keys move between
// tabs (Home and End jump to the first and last one), and the selected tab shows its panel
export function Tabs({ label, items, defaultValue, className }: TabsProps) {
  const baseId = useId()
  const [selected, setSelected] = useState(defaultValue ?? items[0].value)
  const tabId = (value: string) => `${baseId}-tab-${value}`
  const panelId = (value: string) => `${baseId}-panel-${value}`

  const selectAt = (index: number) => {
    const item = items[(index + items.length) % items.length]
    setSelected(item.value)
    ;(document.getElementById(tabId(item.value)) as HTMLElement).focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = items.findIndex((item) => item.value === selected)
    const targets: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: items.length - 1,
    }
    const target = targets[event.key]
    if (target === undefined) return
    event.preventDefault()
    selectAt(target)
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {items.map((item) => {
          const isSelected = item.value === selected
          return (
            <button
              key={item.value}
              id={tabId(item.value)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId(item.value)}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(item.value)}
              className={cn(
                '-mb-px min-h-11 border-b-2 px-4 text-sm font-medium whitespace-nowrap',
                isSelected
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.value}
          id={panelId(item.value)}
          role="tabpanel"
          aria-labelledby={tabId(item.value)}
          // The panel can take the focus, so keyboard users reach its content right after the tabs
          tabIndex={0}
          hidden={item.value !== selected}
          className="pt-4"
        >
          {item.content}
        </div>
      ))}
    </div>
  )
}
