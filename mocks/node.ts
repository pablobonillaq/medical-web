import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Intercepts fetch in the unit tests (Node.js), without a real server
export const server = setupServer(...handlers)
