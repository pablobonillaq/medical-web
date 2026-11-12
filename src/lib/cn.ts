import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Joins classes, also conditional ones, and lets the last Tailwind class win when two of them
// set the same thing: cn('px-4 text-sm', isWide && 'px-6') → 'text-sm px-6'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
