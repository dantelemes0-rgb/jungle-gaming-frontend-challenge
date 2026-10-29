import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import './styles.css'

const MOCKS_ENABLED = import.meta.env.VITE_ENABLE_MOCKS === 'true'

async function bootstrap() {
  const params = new URLSearchParams(window.location.search)
  const scenario = params.get('mock')
  if (scenario) localStorage.setItem('jg.mock.scenario', scenario)

  // MSW precisa estar ativo (e com o WebSocket patchado) antes de carregar a app.
  if (MOCKS_ENABLED) {
    const { startMocks } = await import('./mocks/browser')
    await startMocks()
  }

  // Só então baixa o app: garante que socket.io-client use o WebSocket interceptado.
  const [{ router }, { Providers }] = await Promise.all([
    import('./app/router'),
    import('./app/providers'),
  ])

  const container = document.getElementById('root')
  if (!container) throw new Error('Elemento #root não encontrado')

  createRoot(container).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  )
}

void bootstrap()
