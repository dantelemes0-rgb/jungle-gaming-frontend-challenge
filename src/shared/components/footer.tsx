import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-base font-semibold">GreenMint</p>
          <p className="mt-1 max-w-md text-xs text-text-muted">
            Marketplace demonstrativo. NFTs, carteiras, pagamentos e transações são
            simulados — nenhum ativo digital real é negociado.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-6 text-sm">
          <Link to="/" className="text-text-muted hover:text-text">
            Explorar
          </Link>
          <Link to="/account/wallets" className="text-text-muted hover:text-text">
            Carteiras
          </Link>
          <Link to="/account/profile" className="text-text-muted hover:text-text">
            Perfil
          </Link>
        </nav>
        <p className="text-xs text-text-muted">© 2026 GreenMint · dados fictícios</p>
      </div>
    </footer>
  )
}
