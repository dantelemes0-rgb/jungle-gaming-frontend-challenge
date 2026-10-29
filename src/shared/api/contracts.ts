import { z } from 'zod'

/* -------------------------------------------------------------------------- */
/* Primitivos                                                                  */
/* -------------------------------------------------------------------------- */

export const ethAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido')

export const isoDateSchema = z.string().min(1)

export const networkSchema = z.enum(['ethereum', 'polygon', 'base'])
export type Network = z.infer<typeof networkSchema>

export const categorySchema = z.enum([
  'art',
  'collectible',
  'photography',
  'music',
  'virtual-world',
])
export type Category = z.infer<typeof categorySchema>

export const raritySchema = z.enum(['common', 'rare', 'epic', 'legendary'])
export type Rarity = z.infer<typeof raritySchema>

export const sortSchema = z.enum([
  'relevance',
  'price_asc',
  'price_desc',
  'recent',
  'name_asc',
  'rarity',
])
export type SortOption = z.infer<typeof sortSchema>

/* -------------------------------------------------------------------------- */
/* Erros                                                                       */
/* -------------------------------------------------------------------------- */

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(z.object({ field: z.string().optional(), message: z.string() }))
      .optional(),
  }),
})
export type ApiErrorPayload = z.infer<typeof apiErrorSchema>

/* -------------------------------------------------------------------------- */
/* Conta                                                                       */
/* -------------------------------------------------------------------------- */

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  createdAt: isoDateSchema,
})
export type User = z.infer<typeof userSchema>

export const sessionSchema = z.object({
  token: z.string(),
  user: userSchema,
  expiresAt: isoDateSchema,
})
export type Session = z.infer<typeof sessionSchema>

export const walletSchema = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
  network: networkSchema,
  isPrimary: z.boolean(),
})
export type Wallet = z.infer<typeof walletSchema>

/* -------------------------------------------------------------------------- */
/* Catálogo                                                                    */
/* -------------------------------------------------------------------------- */

export const nftSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  collection: z.object({ id: z.string(), name: z.string() }),
  creator: z.object({ id: z.string(), name: z.string() }),
  owner: z.object({ id: z.string(), name: z.string() }),
  priceEth: ethAmountSchema,
  editionsTotal: z.number().int().positive(),
  editionsAvailable: z.number().int().min(0),
  category: categorySchema,
  rarity: raritySchema,
  status: z.enum(['available', 'sold_out']),
  version: z.number().int(),
  updatedAt: isoDateSchema,
})
export type Nft = z.infer<typeof nftSchema>

export const catalogResponseSchema = z.object({
  items: z.array(nftSchema),
  page: z.number().int(),
  perPage: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  serverTime: isoDateSchema,
})
export type CatalogResponse = z.infer<typeof catalogResponseSchema>

/** Estado do catálogo na URL (fonte de verdade). Campos opcionais = URL limpa. */
export const catalogSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  collection: z.string().optional().catch(undefined),
  category: categorySchema.optional().catch(undefined),
  rarity: raritySchema.optional().catch(undefined),
  status: z.enum(['available', 'sold_out']).optional().catch(undefined),
  minPrice: z.string().optional().catch(undefined),
  maxPrice: z.string().optional().catch(undefined),
  sort: sortSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
})
export type CatalogSearch = z.infer<typeof catalogSearchSchema>

/* -------------------------------------------------------------------------- */
/* Carrinho e cotação                                                          */
/* -------------------------------------------------------------------------- */

export const cartItemSchema = z.object({
  nftId: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  qty: z.number().int().min(1),
  unitPriceEth: ethAmountSchema,
  editionsAvailable: z.number().int().min(0),
  lineTotalEth: ethAmountSchema,
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  couponCode: z.string().nullable(),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  version: z.number().int(),
  updatedAt: isoDateSchema,
})
export type Cart = z.infer<typeof cartSchema>

export const quoteSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  couponCode: z.string().nullable(),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  expiresAt: isoDateSchema,
  version: z.number().int(),
  hash: z.string(),
})
export type Quote = z.infer<typeof quoteSchema>

/* -------------------------------------------------------------------------- */
/* Pedidos                                                                     */
/* -------------------------------------------------------------------------- */

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'declined'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  version: z.number().int(),
  items: z.array(cartItemSchema),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  wallet: walletSchema,
  payer: z.object({ name: z.string(), email: z.string() }),
  quoteId: z.string(),
  txHash: z.string().optional(),
  explorerUrl: z.string().optional(),
  declineReason: z.string().optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
})
export type Order = z.infer<typeof orderSchema>

/* -------------------------------------------------------------------------- */
/* Eventos Socket.IO                                                           */
/* -------------------------------------------------------------------------- */

export const nftUpdatedEventSchema = z.object({
  eventId: z.string(),
  nftId: z.string(),
  version: z.number().int(),
  priceEth: ethAmountSchema,
  editionsAvailable: z.number().int().min(0),
  status: z.enum(['available', 'sold_out']),
  at: isoDateSchema,
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = z.object({
  eventId: z.string(),
  orderId: z.string(),
  version: z.number().int(),
  status: orderStatusSchema,
  userId: z.string().optional(),
  txHash: z.string().optional(),
  declineReason: z.string().optional(),
  at: isoDateSchema,
})
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export const sessionExpiredEventSchema = z.object({
  eventId: z.string(),
  at: isoDateSchema,
})
export type SessionExpiredEvent = z.infer<typeof sessionExpiredEventSchema>

/* -------------------------------------------------------------------------- */
/* Payloads de escrita                                                         */
/* -------------------------------------------------------------------------- */

export const registerPayloadSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo'),
  email: z.email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo de 8 caracteres'),
})
export type RegisterPayload = z.infer<typeof registerPayloadSchema>

export const loginPayloadSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})
export type LoginPayload = z.infer<typeof loginPayloadSchema>

export const profilePayloadSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  bio: z.string().max(160, 'Máximo de 160 caracteres').optional(),
})
export type ProfilePayload = z.infer<typeof profilePayloadSchema>

export const passwordPayloadSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(8, 'Mínimo de 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirme a nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })
export type PasswordPayload = z.infer<typeof passwordPayloadSchema>

export const walletPayloadSchema = z.object({
  label: z.string().trim().min(2, 'Informe um rótulo'),
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço deve ter 0x + 40 caracteres hexadecimais'),
  network: networkSchema,
  isPrimary: z.boolean().optional(),
})
export type WalletPayload = z.infer<typeof walletPayloadSchema>

export const checkoutPayerSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do titular'),
  email: z.email('E-mail inválido'),
})
export type CheckoutPayer = z.infer<typeof checkoutPayerSchema>
