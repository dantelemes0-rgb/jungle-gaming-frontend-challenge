import { http, HttpResponse } from 'msw'
import Decimal from 'decimal.js'
import type { CatalogResponse, Nft } from '@/shared/api/contracts'
import { getDb, nowIso, saveDb } from '../db/store'
import { scenarioFromRequest } from '../scenarios'
import {
  apiError,
  bootstrap,
  networkFailure,
  readUser,
  simulateLatency,
  unauthorized,
} from './helpers'

function matchesQuery(nft: Nft, query: string): boolean {
  if (!query) return true
  const haystack = `${nft.name} ${nft.collection.name} ${nft.creator.name} ${nft.category}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

export const catalogHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const failure = networkFailure(request)
    if (failure) return failure

    const scenario = scenarioFromRequest(request)
    if (scenario === 'http-500') {
      return apiError(500, 'INTERNAL_ERROR', 'Falha ao carregar o catálogo.')
    }

    const url = new URL(request.url)
    const params = url.searchParams
    const page = Math.max(1, Number(params.get('page') ?? 1) || 1)
    const perPage = Math.min(48, Math.max(1, Number(params.get('perPage') ?? 12) || 12))
    const sort = params.get('sort') ?? 'relevance'

    let items = getDb().nfts.slice()

    if (scenario === 'empty-catalog') {
      items = []
    } else {
      const query = params.get('q')?.trim() ?? ''
      const collection = params.get('collection') ?? ''
      const category = params.get('category') ?? ''
      const rarity = params.get('rarity') ?? ''
      const status = params.get('status') ?? ''
      const minPrice = params.get('minPrice')
      const maxPrice = params.get('maxPrice')

      items = items.filter((nft) => {
        if (!matchesQuery(nft, query)) return false
        if (collection && nft.collection.id !== collection) return false
        if (category && nft.category !== category) return false
        if (rarity && nft.rarity !== rarity) return false
        if (status && nft.status !== status) return false
        const price = new Decimal(nft.priceEth)
        if (minPrice && price.lessThan(new Decimal(minPrice))) return false
        if (maxPrice && price.greaterThan(new Decimal(maxPrice))) return false
        return true
      })

      switch (sort) {
        case 'price_asc':
          items.sort((a, b) => new Decimal(a.priceEth).comparedTo(b.priceEth))
          break
        case 'price_desc':
          items.sort((a, b) => new Decimal(b.priceEth).comparedTo(a.priceEth))
          break
        case 'name_asc':
          items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
          break
        case 'recent':
          items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          break
        case 'rarity': {
          const rank = { legendary: 0, epic: 1, rare: 2, common: 3 }
          items.sort((a, b) => rank[a.rarity] - rank[b.rarity])
          break
        }
        default:
          break
      }
    }

    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * perPage

    const response: CatalogResponse = {
      items: items.slice(start, start + perPage),
      page: safePage,
      perPage,
      total,
      totalPages,
      serverTime: nowIso(),
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/nfts/facets', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const db = getDb()
    const collections = Array.from(
      new Map(db.nfts.map((nft) => [nft.collection.id, nft.collection])).values(),
    ).map((collection) => ({
      ...collection,
      count: db.nfts.filter((nft) => nft.collection.id === collection.id).length,
    }))
    const categories = (
      ['art', 'collectible', 'photography', 'music', 'virtual-world'] as const
    ).map((id) => ({
      id,
      count: db.nfts.filter((nft) => nft.category === id).length,
    }))
    const prices = db.nfts.map((nft) => new Decimal(nft.priceEth))
    const min = prices.reduce((acc, price) => (price.lessThan(acc) ? price : acc), prices[0]!)
    const max = prices.reduce((acc, price) => (price.greaterThan(acc) ? price : acc), prices[0]!)

    return HttpResponse.json({
      collections,
      categories,
      total: db.nfts.length,
      minPriceEth: min.toFixed(4),
      maxPriceEth: max.toFixed(4),
    })
  }),

  http.get('/api/nfts/:id', async ({ request, params }) => {
    await bootstrap()
    await simulateLatency(request)
    const failure = networkFailure(request)
    if (failure) return failure

    const nft = getDb().nfts.find((item) => item.id === params.id)
    if (!nft) return apiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
    return HttpResponse.json(nft)
  }),

  http.get('/api/favorites', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const db = getDb()
    const ids = db.favorites[user.id] ?? []
    const items = db.nfts.filter((nft) => ids.includes(nft.id))
    return HttpResponse.json({ nftIds: ids, items })
  }),

  http.put('/api/favorites/:nftId', async ({ request, params }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    if (scenarioFromRequest(request) === 'favorite-failure') {
      return apiError(500, 'INTERNAL_ERROR', 'Não foi possível salvar o favorito.')
    }

    const db = getDb()
    const nft = db.nfts.find((item) => item.id === params.nftId)
    if (!nft) return apiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')

    const list = db.favorites[user.id] ?? []
    if (!list.includes(nft.id)) list.push(nft.id)
    db.favorites[user.id] = list
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/api/favorites/:nftId', async ({ request, params }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    if (scenarioFromRequest(request) === 'favorite-failure') {
      return apiError(500, 'INTERNAL_ERROR', 'Não foi possível remover o favorito.')
    }

    const db = getDb()
    db.favorites[user.id] = (db.favorites[user.id] ?? []).filter((id) => id !== params.nftId)
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),
]
