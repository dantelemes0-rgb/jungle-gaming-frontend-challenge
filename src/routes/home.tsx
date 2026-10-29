import { createRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { useCatalog } from '@/features/catalog/hooks'
import { CatalogFilters, CatalogToolbar, Pagination } from '@/features/catalog/filter-bar'
import { catalogSearchSchema, type CatalogSearch } from '@/shared/api/contracts'
import { NftCard } from '@/shared/components/nft-card'
import { EmptyState, ErrorState, NftGridSkeleton } from '@/shared/components/states'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { rootRoute } from './root'

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search) => catalogSearchSchema.parse(search),
  component: HomePage,
})

function HomePage() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate()
  const catalog = useCatalog(search)
  const featured = useCatalog({ page: 1, sort: 'recent' })

  const update = (patch: Partial<CatalogSearch>) => {
    void navigate({ to: '/', search: (previous) => ({ ...previous, ...patch }) })
  }

  const clear = () => {
    void navigate({ to: '/', search: {} })
  }

  const page = search.page ?? 1

  // Se a API ajustar a página (ex.: page=999 → última), reflete na URL.
  // Ignora o placeholder da página anterior durante a troca de filtro/página.
  useEffect(() => {
    if (catalog.isPlaceholderData) return
    const current = catalog.data?.page
    if (current && search.page && current !== search.page) {
      void navigate({
        to: '/',
        search: (previous) => ({ ...previous, page: current }),
        replace: true,
      })
    }
  }, [catalog.data?.page, catalog.isPlaceholderData, search.page, navigate])

  return (
    <>
      <section className="container-page pt-8">
        <div className="grid gap-6 rounded-[var(--radius-card)] border border-border bg-surface p-6 lg:grid-cols-[1fr_450px] lg:items-center lg:p-10">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-text-muted uppercase">
              Bem-vindo à Kurio
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.08] font-bold uppercase sm:text-5xl lg:text-[43px]">
              Seja dono do futuro da arte digital
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-text-muted">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione
              arte digital, apoie artistas e faça parte do novo futuro da cultura.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a href="#catalogo">
                  Explorar
                  <ArrowRight aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/register" search={{ redirect: undefined }}>
                  Criar conta
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            {featured.data?.items[0] ? (
              <img
                src={featured.data.items[0].imageUrl}
                alt={`Arte de ${featured.data.items[0].name}`}
                width={450}
                height={450}
                fetchPriority="high"
                className="aspect-square w-full rounded-[var(--radius-image)] border border-border object-cover"
              />
            ) : (
              <Skeleton className="aspect-square w-full rounded-[var(--radius-image)]" />
            )}
          </div>
        </div>
      </section>

      {/* content-visibility: o catálogo abaixo da dobra só é renderizado ao se aproximar da viewport (menos layout/paint no mobile). */}
      <section
        id="catalogo"
        className="container-page scroll-mt-20 py-12 [contain-intrinsic-size:auto_1600px] [content-visibility:auto]"
      >
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="font-display text-2xl font-semibold">Catálogo</h2>
          <p className="text-sm text-text-muted">
            Busque, combine filtros e ordene. O estado fica na URL e sobrevive ao refresh.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-[var(--radius-card)] border border-border bg-surface p-5">
              <CatalogFilters search={search} onChange={update} onClear={clear} />
            </div>
          </aside>

          <div>
            <div className="mb-6">
              <CatalogToolbar
                search={search}
                onChange={update}
                onClear={clear}
                total={catalog.isError ? undefined : (catalog.data?.total ?? 0)}
              />
            </div>

            {catalog.isError ? (
              <ErrorState
                description="Não foi possível carregar o catálogo. Verifique a conexão e tente novamente."
                onRetry={() => void catalog.refetch()}
              />
            ) : catalog.isLoading ? (
              <NftGridSkeleton count={8} />
            ) : catalog.data && catalog.data.items.length === 0 ? (
              <EmptyState
                title="Nenhum NFT encontrado"
                description="Ajuste a busca ou remova alguns filtros para ver mais resultados."
                action={
                  <Button variant="secondary" onClick={clear}>
                    Limpar filtros
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {(catalog.data?.items ?? []).map((nft, index) => (
                    <NftCard key={nft.id} nft={nft} priority={index < 2} />
                  ))}
                </div>
                <Pagination
                  page={catalog.data?.page ?? page}
                  totalPages={catalog.data?.totalPages ?? 1}
                  onChange={(next) => {
                    update({ page: next })
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                />
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
