import type { NextConfig } from 'next'
import { env } from './src/config/env'
import { apiRewrites } from './src/config/rewrites'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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