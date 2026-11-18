// A stand-in for the Express API in the end-to-end tests and Lighthouse CI, which run without
// the API and its database. It answers only what the pages ask for today; anything else is 404.
// Next.js forwards /api/* to it through API_URL, as it would to the real API
import { createServer } from 'node:http'

const PORT = Number(process.env.FAKE_API_PORT ?? 3000)

const routes = {
  'GET /health': () => ({
    status: 'ok',
    database: 'up',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }),
}

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost')
  const route = routes[`${request.method} ${pathname}`]

  response.writeHead(route ? 200 : 404, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(route ? route() : { error: 'Not found' }))
}).listen(PORT, () => {
  console.log(`Fake API ready on http://localhost:${PORT}`)
})
