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
    // O gate é registrado antes do render; o chunk do MSW sobe em paralelo
    // e as chamadas HTTP esperam por ele (sem bloquear o primeiro paint).
    const { setMocksGate } = await import('./shared/api/mock-gate')
    setMocksGate(import('./mocks/browser').then((mocks) => mocks.startMocks()))
  }

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
