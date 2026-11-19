import type { NextConfig } from 'next'
import { env } from './src/config/env'
import { apiRewrites } from './src/config/rewrites'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // forbidden() and forbidden.tsx: a signed-in visitor whose role may not see a page gets a 403
    authInterrupts: true,
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async rewrites() {
    return apiRewrites(env.API_URL)
  },
}

export default nextConfig
