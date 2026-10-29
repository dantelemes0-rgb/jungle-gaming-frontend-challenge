import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface CartUiContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  setOpen: (open: boolean) => void
}

const CartUiContext = createContext<CartUiContextValue | null>(null)

export function CartUiProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const value = useMemo<CartUiContextValue>(
    () => ({ isOpen, open: () => setOpen(true), close: () => setOpen(false), setOpen }),
    [isOpen],
  )
  return <CartUiContext.Provider value={value}>{children}</CartUiContext.Provider>
}

export function useCartUi(): CartUiContextValue {
  const context = useContext(CartUiContext)
  if (!context) throw new Error('useCartUi deve ser usado dentro de CartUiProvider')
  return context
}
