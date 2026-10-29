# Contratos REST e eventos (referência rápida)

Base: `/api` · JSON · ETH como string decimal · quantidades inteiras.

## Erros

```json
{ "error": { "code": "CODE", "message": "…", "details": [{ "field": "qty", "message": "…" }] } }
```

| HTTP | Códigos |
|---:|---|
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHENTICATED`, `SESSION_EXPIRED`, `INVALID_CREDENTIALS` |
| 404 | `NFT_NOT_FOUND`, `ORDER_NOT_FOUND`, `WALLET_NOT_FOUND`, `CART_ITEM_NOT_FOUND` |
| 409 | `EMAIL_TAKEN`, `INSUFFICIENT_STOCK`, `EDITION_SOLD_OUT`, `QUOTE_CHANGED`, `IDEMPOTENCY_CONFLICT`, `DUPLICATE_WALLET` |
| 410 | `COUPON_EXPIRED` |
| 422 | `VALIDATION_ERROR`, `COUPON_INVALID`, `WRONG_PASSWORD` |
| 500/503 | `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE` |

## Entidades

```ts
interface Nft {
  id: string; name: string; description: string; imageUrl: string
  collection: { id: string; name: string }
  creator: { id: string; name: string }; owner: { id: string; name: string }
  priceEth: string; editionsTotal: number; editionsAvailable: number
  category: 'art'|'collectible'|'photography'|'music'|'virtual-world'
  rarity: 'common'|'rare'|'epic'|'legendary'
  status: 'available'|'sold_out'; version: number; updatedAt: string
}

interface CartItem { nftId: string; name: string; imageUrl: string; qty: number
  unitPriceEth: string; editionsAvailable: number; lineTotalEth: string }

interface Cart { items: CartItem[]; couponCode: string | null
  subtotalEth: string; discountEth: string; totalEth: string
  version: number; updatedAt: string }

interface Quote extends Omit<Cart,'updatedAt'> { id: string; networkFeeEth: string
  expiresAt: string; hash: string }

interface Order { id: string; status: 'pending'|'confirmed'|'declined'; version: number
  items: CartItem[]; subtotalEth: string; discountEth: string; networkFeeEth: string; totalEth: string
  wallet: Wallet; payer: { name: string; email: string }; quoteId: string
  txHash?: string; explorerUrl?: string; declineReason?: string
  createdAt: string; updatedAt: string }
```

## Endpoints

| Método | Rota | Corpo / query | Resposta |
|---|---|---|---|
| POST | `/auth/register` | `{name,email,password}` | 201 `Session` · 409 `EMAIL_TAKEN` |
| POST | `/auth/login` | `{email,password}` | 200 `Session` · 401 |
| GET | `/auth/session` | — | `{user,expiresAt}` · 401 |
| POST | `/auth/logout` | — | 204 |
| GET | `/nfts` | `q,collection,category,rarity,status,minPrice,maxPrice,sort,page,perPage` | `{items,page,perPage,total,totalPages,serverTime}` |
| GET | `/nfts/facets` | — | `{collections,minPriceEth,maxPriceEth}` |
| GET | `/nfts/:id` | — | `Nft` · 404 |
| GET/PUT/DELETE | `/favorites[/:nftId]` | — | `{nftIds,items}` / 204 |
| GET | `/cart` | — | `Cart` |
| POST | `/cart/items` | `{nftId,qty}` | 201 `Cart` · 409 |
| PATCH | `/cart/items/:nftId` | `{qty}` | `Cart` · 409 |
| DELETE | `/cart/items/:nftId` | — | `Cart` |
| POST | `/cart/merge` | `{items:[]}` | `Cart` |
| POST/DELETE | `/cart/coupon` | `{code}` | `Cart` · 422/410 |
| POST | `/quote` | `{couponCode?}` | `Quote` |
| POST | `/orders` | `{quoteId,quoteHash,quoteExpiresAt,walletId,network,payer}` + `Idempotency-Key` | 201 `Order` · 409 |
| GET | `/orders/:id` | — | `Order` |
| GET | `/orders` | `?status=` | `{items}` |
| GET/PATCH | `/me` | `{name?,bio?}` | `User` |
| PUT | `/me/avatar` | `{avatarUrl}` | `User` |
| PUT | `/me/password` | `{currentPassword,newPassword}` | 204 · 422 |
| GET/POST | `/wallets` | `{label,address,network,isPrimary?}` | `{items}` / `Wallet` |
| PATCH | `/wallets/:id` | parcial | `Wallet` |

## Eventos Socket.IO

```ts
'nft.updated'   { eventId, nftId, version, priceEth, editionsAvailable, status, at }
'order.updated' { eventId, orderId, version, status, txHash?, declineReason?, at }
'session.expired' { eventId, at }
```

Cliente: ignora `eventId` repetido e `version <=` última conhecida; ao reconectar, invalida catálogo/detalhe/carrinho/pedidos; ao sair, desconecta e limpa cache.
