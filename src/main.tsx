import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import './styles.css'

const MOCKS_ENABLED = import.meta.env.VITE_ENABLE_MOCKS === 'true'

async function bootstrap() {
  const params = new URLSearchParams(window.location.search)
  const scenario = params.get('mock')
  if (scenario) localStorage.setItem('jg.mock.scenario', scenario)

  if (MOCKS_ENABLED) {
    const { startMocks } = await import('./mocks/browser')
    await startMocks()
  }

  const [{ router }, { Providers }] = await Promise.all([
    import('./app/router'),
    import('./app/providers'),
  ])

  const container = document.getElementById('root')
  if (!container) throw new Error('Elemento #root nÃ£o encontrado')

  createRoot(container).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  )
}

void bootstrap()

