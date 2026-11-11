import { z } from 'zod'

const envSchema = z.object({
  // Where the Express API runs. Only the Next.js server talks to it: the browser always calls /api
  API_URL: z
    .url({ protocol: /^https?$/, error: 'API_URL must be an http or https URL' })
    .default('http://localhost:3000'),
})

// Throws with every problem listed, so a wrong value stops the app before it serves anything
export const parseEnv = (vars: Record<string, string | undefined>) => {
  const result = envSchema.safeParse(vars)
  if (!result.success) {
    throw new Error('Invalid environment variables:\n' + z.prettifyError(result.error))
  }
  return result.data
}

export const env = parseEnv(process.env)
