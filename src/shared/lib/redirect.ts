import { z } from 'zod'

/**
 * Aceita apenas caminhos internos ("/checkout", "/nft/nft-03?x=1").
 * Bloqueia URLs absolutas, protocol-relative ("//", "/\\") e esquemas como "javascript:",
 * evitando open redirect após login/cadastro.
 */
const INTERNAL_PATH = /^\/(?![/\\])/

export const redirectSearchSchema = z.object({
  redirect: z.string().regex(INTERNAL_PATH).optional().catch(undefined),
})
