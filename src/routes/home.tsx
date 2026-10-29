import { createRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useCatalog } from '@/features/catalog/hooks'
import { CatalogFilters, CatalogToolbar, Pagination } from '@/features/catalog/filter-bar'
import { catalogSearchSchema, type CatalogSearch } from '@/shared/api/contracts'
import { NftCard } from '@/shared/components/nft-card'
import { EmptyState, ErrorState, NftGridSkeleton } from '@/shared/components/states'
import { Button } from '@/shared/ui/button'
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

  return (
    <>
      <section className="border-b border-border">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Coleção GreenMint · edições limitadas
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-6xl">
              Descubra, colecione e negocie arte digital.
            </h1>
            <p className="mt-5 max-w-xl text-base text-text-muted">
              Um marketplace para edições verificáveis de artistas independentes. Explore
              coleções, monte seu carrinho e finalize com carteira simulada.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#catalogo">
                  Explorar catálogo
                  <ArrowRight aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/register" search={{ redirect: undefined }}>
                  Criar conta
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                { label: 'Edições', value: `${catalog.data?.total ?? '—'}` },
                { label: 'Coleções', value: '4' },
                { label: 'Taxa de rede', value: '0,0025' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs tracking-wide text-text-muted uppercase">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-xl font-semibold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {(featured.data?.items ?? []).slice(0, 4).map((nft, index) => (
                <div
                  key={nft.id}
                  className={index % 2 === 1 ? 'translate-y-6' : undefined}
                >
                  <img
                    src={nft.imageUrl}
                    alt={`Arte de ${nft.name}`}
                    width={640}
                    height={640}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    className="aspect-square w-full rounded-[var(--radius-card)] border border-border object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="container-page scroll-mt-20 py-12">
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
                total={catalog.data?.total ?? 0}
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
