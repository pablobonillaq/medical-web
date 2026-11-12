import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type TableProps = ComponentProps<'table'> & {
  // Names the table for screen readers, and is shown above it
  caption: ReactNode
}

// On a narrow screen the table scrolls sideways. The scroll area can take the focus and has a
// name, so keyboard users can scroll it with the arrow keys (WCAG 2.1.1 and 1.4.10)
export function Table({ caption, className, children, ...props }: TableProps) {
  const captionId = useId()

  return (
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      className="w-full overflow-x-auto rounded-lg border border-border bg-surface"
    >
      <table className={cn('w-full border-collapse text-left text-sm', className)} {...props}>
        <caption id={captionId} className="px-4 py-3 text-left text-base font-semibold">
          {caption}
        </caption>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('border-b border-border', className)} {...props} />
}

export function TableBody(props: ComponentProps<'tbody'>) {
  return <tbody {...props} />
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return <tr className={cn('border-b border-border last:border-b-0', className)} {...props} />
}

// scope tells screen readers which cells each header describes. Use scope="row" for the first
// cell of a row when it names the row
export function TableHeader({ scope = 'col', className, ...props }: ComponentProps<'th'>) {
  return <th scope={scope} className={cn('px-4 py-3 font-semibold', className)} {...props} />
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('px-4 py-3', className)} {...props} />
}
