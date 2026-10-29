import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { ensureDb } from './db/store'

export const worker = setupWorker(...handlers)

export async function startMocks(): Promise<void> {
  await ensureDb()
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
    quiet: true,
  })
}
