import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { CartUiProvider } from '@/features/cart/cart-ui'
import { queryClient } from './query-client'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CartUiProvider>
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          closeButton
          toastOptions={{
            style: {
              background: '#191d18',
              border: '1px solid #2b312a',
              color: '#f1f5ec',
            },
          }}
        />
        {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </CartUiProvider>
    </QueryClientProvider>
  )
}
