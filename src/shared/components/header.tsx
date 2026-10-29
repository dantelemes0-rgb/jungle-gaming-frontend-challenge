import { Link, useNavigate } from '@tanstack/react-router'
import { Leaf, LogOut, Menu, ShoppingBag, User, Wallet } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { initials } from '@/shared/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { useCurrentUser, useLogout } from '@/features/auth/hooks'
import { useCartCount } from '@/features/cart/hooks'
import { useCartUi } from '@/features/cart/cart-ui'

const MOBILE_NAV = [
  { to: '/', label: 'Explorar' },
  { to: '/account/wallets', label: 'Carteiras' },
  { to: '/account/profile', label: 'Perfil' },
] as const

export function Header() {
  const user = useCurrentUser()
  const cartCount = useCartCount()
  const { open } = useCartUi()
  const logout = useLogout()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const go = (to: '/' | '/account/wallets' | '/account/profile') => {
    setMenuOpen(false)
    void navigate({ to })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2" aria-label="GreenMint — início">
            <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-contrast">
              <Leaf className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              GreenMint
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className="rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:text-text"
              activeProps={{ className: 'text-text' }}
              activeOptions={{ exact: true }}
            >
              Explorar
            </Link>
            <Link
              to="/account/wallets"
              className="rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:text-text"
              activeProps={{ className: 'text-text' }}
            >
              Carteiras
            </Link>
            <Link
              to="/account/profile"
              className="rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:text-text"
              activeProps={{ className: 'text-text' }}
            >
              Perfil
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={open}
            aria-label={`Abrir carrinho${cartCount > 0 ? ` (${cartCount} itens)` : ''}`}
            className="relative"
          >
            <ShoppingBag aria-hidden="true" />
            {cartCount > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-contrast"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            ) : null}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu da conta">
                  <Avatar className="size-8">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => go('/account/profile')}>
                  <User className="size-4" aria-hidden="true" /> Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => go('/account/wallets')}>
                  <Wallet className="size-4" aria-hidden="true" /> Carteiras
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout.mutate()}>
                  <LogOut className="size-4" aria-hidden="true" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login" search={{ redirect: undefined }}>
                  Entrar
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register" search={{ redirect: undefined }}>
                  Criar conta
                </Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav aria-label="Navegação mobile" className="flex flex-col gap-1 p-4">
            {MOBILE_NAV.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => go(item.to)}
                className={cn(
                  'rounded-md px-3 py-3 text-left text-sm text-text-muted hover:bg-surface-2 hover:text-text',
                )}
              >
                {item.label}
              </button>
            ))}
            {!user ? (
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild>
                  <Link to="/login" search={{ redirect: undefined }}>
                    Entrar
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/register" search={{ redirect: undefined }}>
                    Criar conta
                  </Link>
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => {
                  setMenuOpen(false)
                  logout.mutate()
                }}
              >
                <LogOut aria-hidden="true" /> Sair
              </Button>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
