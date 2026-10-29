import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { useCartUi } from './cart-ui'
import { CartSummary } from './cart-summary'

export function CartDrawer() {
  const { isOpen, setOpen } = useCartUi()

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" aria-describedby="cart-drawer-description">
        <SheetHeader>
          <SheetTitle>Carrinho</SheetTitle>
          <SheetDescription id="cart-drawer-description">
            Revise suas edições antes de finalizar.
          </SheetDescription>
        </SheetHeader>
        <CartSummary compact onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
