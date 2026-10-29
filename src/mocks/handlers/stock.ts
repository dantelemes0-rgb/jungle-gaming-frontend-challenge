import { http, HttpResponse } from 'msw'
import { getDb, nowIso, saveDb, touchCartsContaining } from '../db/store'
import { publishRealtime } from '../socket/bus'
import { bootstrap } from './helpers'

/** Hook determinístico: muda o estoque de um NFT e emite nft.updated. */
export const stockChangeHandler = http.post('/api/__mock/stock-change', async ({ request }) => {
  await bootstrap()
  const body = (await request.json().catch(() => ({}))) as {
    nftId?: string
    delta?: number
  }

  const db = getDb()
  const nft = body.nftId
    ? db.nfts.find((item) => item.id === body.nftId)
    : db.nfts.find((item) => item.editionsAvailable > 2)

  if (!nft) {
    return HttpResponse.json(
      { error: { code: 'NFT_NOT_FOUND', message: 'NFT não encontrado.' } },
      { status: 404 },
    )
  }

  nft.editionsAvailable = Math.max(0, nft.editionsAvailable + (body.delta ?? -1))
  nft.status = nft.editionsAvailable === 0 ? 'sold_out' : 'available'
  nft.version += 1
  nft.updatedAt = nowIso()
  saveDb()
  touchCartsContaining(nft.id)

  publishRealtime({
    event: 'nft.updated',
    payload: {
      eventId: crypto.randomUUID(),
      nftId: nft.id,
      version: nft.version,
      priceEth: nft.priceEth,
      editionsAvailable: nft.editionsAvailable,
      status: nft.status,
      at: nft.updatedAt,
    },
  })

  return HttpResponse.json({
    ok: true,
    nftId: nft.id,
    editionsAvailable: nft.editionsAvailable,
  })
})
