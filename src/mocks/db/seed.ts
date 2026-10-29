import type { Nft } from '@/shared/api/contracts'
import { mulberry32 } from '@/shared/lib/prng'
import type { Db, DbCoupon, DbOrder, DbUser, DbWallet } from './schema'

const NOW = '2026-10-28T12:00:00.000Z'

const COLLECTIONS = [
  { id: 'col-aurora', name: 'Aurora' },
  { id: 'col-verde', name: 'Verde Profundo' },
  { id: 'col-circuit', name: 'Circuit' },
  { id: 'col-nocturne', name: 'Nocturne' },
]

const CREATORS = [
  { id: 'usr-ana', name: 'Ana Ribeiro' },
  { id: 'usr-bruno', name: 'Bruno Salles' },
  { id: 'usr-lia', name: 'Lia Moretti' },
  { id: 'usr-theo', name: 'Theo Nakamura' },
]

const PREFIXES = ['Orbe', 'Fragmento', 'Sinal', 'Jardim', 'Cintilante', 'Vórtice', 'Raiz', 'Eclipse']
const SUFFIXES = ['Verde', 'Nômade', 'Solar', 'Oculto', 'Sintético', 'Primitivo', 'Flutuante', 'Digital']

const CATEGORIES = ['art', 'collectible', 'photography', 'music', 'virtual-world'] as const
const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const

/** SHA-256 real (WebCrypto). Senhas nunca ficam em claro no mock. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function buildNfts(): Nft[] {
  const random = mulberry32(20261028)
  const nfts: Nft[] = []

  for (let index = 0; index < 24; index += 1) {
    const seed = index + 1
    const collection = COLLECTIONS[index % COLLECTIONS.length] ?? COLLECTIONS[0]!
    const creator = CREATORS[index % CREATORS.length] ?? CREATORS[0]!
    const total = 5 + Math.floor(random() * 40)
    const soldOut = index === 6 || index === 17
    const available = soldOut ? 0 : Math.max(1, Math.floor(total * (0.2 + random() * 0.7)))
    const price = (0.012 + random() * 8.4).toFixed(4)

    nfts.push({
      id: `nft-${String(seed).padStart(2, '0')}`,
      slug: `${PREFIXES[index % PREFIXES.length]}-${SUFFIXES[index % SUFFIXES.length]}-${seed}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''),
      name: `${PREFIXES[index % PREFIXES.length]} ${SUFFIXES[index % SUFFIXES.length]} #${seed}`,
      description:
        'Edição digital original da coleção Kurio. Cada peça existe em número limitado e é verificável on-chain (simulado).',
      imageUrl: `/assets/nfts/nft-${String(seed).padStart(2, '0')}.svg`,
      collection,
      creator,
      owner: CREATORS[(index + 2) % CREATORS.length] ?? CREATORS[0]!,
      priceEth: price,
      editionsTotal: total,
      editionsAvailable: available,
      category: CATEGORIES[index % CATEGORIES.length] ?? 'art',
      rarity: RARITIES[Math.min(3, Math.floor(random() * 4))] ?? 'common',
      status: soldOut ? 'sold_out' : 'available',
      version: 1,
      updatedAt: NOW,
    })
  }

  return nfts
}

function buildUsers(): Array<Omit<DbUser, 'passwordHash'> & { passwordHash: string }> {
  return [
    {
      id: 'usr-ana',
      name: 'Ana Ribeiro',
      email: 'ana@jungle.test',
      bio: 'Colecionadora de arte generativa e jardins digitais.',
      avatarUrl: '/assets/avatars/avatar-01.svg',
      createdAt: NOW,
      salt: 'jg-ana',
      passwordHash: '',
    },
    {
      id: 'usr-bruno',
      name: 'Bruno Salles',
      email: 'bruno@jungle.test',
      bio: 'Fotógrafo noturno. Caçador de edições raras.',
      avatarUrl: '/assets/avatars/avatar-02.svg',
      createdAt: NOW,
      salt: 'jg-bruno',
      passwordHash: '',
    },
  ]
}

function buildWallets(): DbWallet[] {
  return [
    {
      id: 'wlt-ana-1',
      userId: 'usr-ana',
      label: 'Carteira principal',
      address: '0x8f3c2a1b4d5e6f708192a3b4c5d6e7f80910a1b2',
      network: 'ethereum',
      isPrimary: true,
    },
    {
      id: 'wlt-ana-2',
      userId: 'usr-ana',
      label: 'Reserva Polygon',
      address: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091011b2c3',
      network: 'polygon',
      isPrimary: false,
    },
    {
      id: 'wlt-bruno-1',
      userId: 'usr-bruno',
      label: 'Carteira principal',
      address: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d',
      network: 'base',
      isPrimary: true,
    },
  ]
}

function buildCoupons(): DbCoupon[] {
  return [
    { code: 'GREEN10', percent: 10, expiresAt: null },
    { code: 'EXPIRED10', percent: 10, expiresAt: '2026-01-01T00:00:00.000Z' },
  ]
}

function buildOrders(nfts: Nft[]): DbOrder[] {
  const first = nfts[0]!
  const second = nfts[1]!

  return [
    {
      id: 'ord-1001',
      userId: 'usr-ana',
      status: 'confirmed',
      version: 2,
      items: [
        {
          nftId: first.id,
          name: first.name,
          imageUrl: first.imageUrl,
          qty: 1,
          unitPriceEth: '0.4200',
          editionsAvailable: first.editionsAvailable,
          lineTotalEth: '0.4200',
        },
      ],
      subtotalEth: '0.4200',
      discountEth: '0.0000',
      networkFeeEth: '0.0025',
      totalEth: '0.4225',
      wallet: {
        id: 'wlt-ana-1',
        label: 'Carteira principal',
        address: '0x8f3c2a1b4d5e6f708192a3b4c5d6e7f80910a1b2',
        network: 'ethereum',
        isPrimary: true,
      },
      payer: { name: 'Ana Ribeiro', email: 'ana@jungle.test' },
      quoteId: 'quote-seed-1',
      idempotencyKey: 'seed-key-1',
      payloadHash: 'seed-hash-1',
      txHash: '0x7d4f9c2a1e8b3f605d7a9c1e4b8f2d6a0c3e5f7b9d1a3c5e7f9b0d2a4c6e8f10',
      explorerUrl: 'https://etherscan.io/tx/0x7d4f9c2a1e8b3f605d7a9c1e4b8f2d6a0c3e5f7b9d1a3c5e7f9b0d2a4c6e8f10',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ord-1002',
      userId: 'usr-bruno',
      status: 'declined',
      version: 2,
      items: [
        {
          nftId: second.id,
          name: second.name,
          imageUrl: second.imageUrl,
          qty: 1,
          unitPriceEth: '1.1500',
          editionsAvailable: second.editionsAvailable,
          lineTotalEth: '1.1500',
        },
      ],
      subtotalEth: '1.1500',
      discountEth: '0.0000',
      networkFeeEth: '0.0025',
      totalEth: '1.1525',
      wallet: {
        id: 'wlt-bruno-1',
        label: 'Carteira principal',
        address: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d',
        network: 'base',
        isPrimary: true,
      },
      payer: { name: 'Bruno Salles', email: 'bruno@jungle.test' },
      quoteId: 'quote-seed-2',
      idempotencyKey: 'seed-key-2',
      payloadHash: 'seed-hash-2',
      declineReason: 'Saldo insuficiente na carteira simulada.',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ]
}

export const DEMO_PASSWORDS: Record<string, string> = {
  'ana@jungle.test': 'jungle123',
  'bruno@jungle.test': 'jungle123',
}

/** Cria uma base determinística completa. */
export async function createSeedDb(): Promise<Db> {
  const users = buildUsers()
  for (const user of users) {
    user.passwordHash = await hashPassword(DEMO_PASSWORDS[user.email] ?? 'jungle123', user.salt)
  }

  const nfts = buildNfts()

  return {
    schemaVersion: 1,
    seed: 'kurio-v1',
    users,
    wallets: buildWallets(),
    nfts,
    favorites: { 'usr-ana': [nfts[2]!.id, nfts[5]!.id], 'usr-bruno': [] },
    carts: {},
    sessions: [],
    orders: buildOrders(nfts),
    coupons: buildCoupons(),
    idempotency: {},
  }
}
