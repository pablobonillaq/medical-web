import { notFound } from 'next/navigation'

// This route never renders a page, so there is nothing to check for instant navigation
export const instant = false

// Catches every address under /es or /en that matches no page, so the 404 is shown by
// [lang]/not-found.tsx: inside the layout and in the language of the URL
export default function CatchAll() {
  notFound()
}
