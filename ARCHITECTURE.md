# ARCHITECTURE — Kurio

Documento de decisões técnicas, contratos, políticas de estado e limitações da entrega.

---

## 1. Visão em camadas

```
UI (routes + features/components)
        ↓ hooks (useQuery/useMutation)
Estado de servidor (TanStack Query)  ←→  Estado de UI (contexto do carrinho/drawer)
        ↓
Contratos tipados (Zod + TypeScript)
        ↓
Transporte (Axios — instância única + interceptores)
        ↓
Rede ── HTTP ──▶ MSW handlers ──▶ Mock DB (memória + localStorage)
     ── WS ────▶ MSW WebSocket + SocketIo binding ──▶ event bus ──▶ socket.io-client
```

Regra: **nenhum componente conhece dados fictícios**. Toda leitura/escrita passa por Axios; o MSW é o backend.

---

## 2. Decisões (ADRs)

| ID | Decisão | Motivo |
|---|---|---|
| ADR-001 | MSW **2.15.0** fixo; MSW 3 não é usado | `@mswjs/socket.io-binding@0.2.0` exige peer `msw ^2.10.2`; a v3 quebra o handshake |
| ADR-002 | Vite 7 + React 19 + TypeScript 5.9 | estabilidade do ecossistema (TS 7 recém-lançado) |
| ADR-003 | Tailwind 4 com `@tailwindcss/vite` | tema por `@theme`, sem `tailwind.config.js` |
| ADR-004 | ETH como **string decimal** + `decimal.js` | evitar erro de ponto flutuante em soma/comparação |
| ADR-005 | Catálogo com estado na URL (`validateSearch` + Zod) | refresh e histórico obrigatórios |
| ADR-006 | Assets locais determinísticos (SVG) | Figma somente leitura + performance + licença |
| ADR-007 | Cenários de mock configuráveis por `localStorage`/URL | reproduzível em dev, demo e testes |
| ADR-008 | Rotas **code-based** (`createRoute`) | elimina codegen e build frágil em checkout limpo |
| ADR-009 | SPA (sem SSR) | deploy estático simples e compatível com MSW |
| ADR-010 | Store do mock em `localStorage` versionado | refresh sem backend, reset determinístico |

---

## 3. Rotas e proteção

| Rota | Acesso | Observação |
|---|---|---|
| `/` | pública | catálogo com busca/filtros/ordenação/página na URL |
| `/nft/$nftId` | pública | acesso direto, 404 e esgotado |
| `/cart` | pública | visitante + merge no login |
| `/checkout` | privada | `beforeLoad` → `ensureSession` |
| `/orders/$orderId` | privada | recuperação de pedido pendente |
| `/login`, `/register` | pública | `redirect` de retorno |
| `/account/profile`, `/account/wallets` | privada | perfil e carteiras |
| `*` | pública | 404 com retorno ao catálogo |

Guard:

```ts
beforeLoad: async ({ context, location }) => {
  try { await ensureSession(context.queryClient) }
  catch { throw redirect({ to: '/login', search: { redirect: location.href } }) }
}
```

---

## 4. Contratos REST

Base `/api`. Erros sempre no envelope:

```json
{ "error": { "code": "INSUFFICIENT_STOCK", "message": "…", "details": [{ "field": "qty", "message": "…" }] } }
```

| Recurso | Endpoints |
|---|---|
| Sessão | `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` |
| NFTs | `GET /nfts` (q, collection, category, rarity, status, minPrice, maxPrice, sort, page, perPage), `GET /nfts/facets`, `GET /nfts/:id` |
| Favoritos | `GET /favorites`, `PUT /favorites/:nftId`, `DELETE /favorites/:nftId` |
| Carrinho | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:nftId`, `DELETE /cart/items/:nftId`, `POST /cart/merge`, `POST/DELETE /cart/coupon` |
| Cotação | `POST /quote` |
| Pedidos | `POST /orders` (+ `Idempotency-Key`), `GET /orders`, `GET /orders/:id` |
| Perfil | `GET/PATCH /me`, `PUT /me/avatar`, `PUT /me/password` |
| Carteiras | `GET/POST /wallets`, `PATCH /wallets/:id` |
| Controle do mock | `POST /__mock/reset`, `POST /__mock/scenario`, `GET /__mock/state`, `POST /__mock/price-change` |

Regras de pedido:

1. `Idempotency-Key` obrigatória. Mesma chave + mesmo payload → **mesmo pedido** (200).
2. Mesma chave + payload diferente → `409 IDEMPOTENCY_CONFLICT`.
3. Cotação é revalidada por `hash` + `expiresAt`; divergência → `409 QUOTE_CHANGED` com a cotação nova.
4. Pedido nasce `pending`; só vira recibo após `confirmed` (evento ou polling).
5. `confirmed` baixa estoque e remove **apenas** as quantidades compradas.
6. `declined` preserva o carrinho e registra o motivo.
7. `confirmed`/`declined` são terminais.

Detalhes de payloads: `docs/contratos.md`.

---

## 5. Sessão

- Token opaco fictício guardado em `localStorage` (`jg.token`) e no mock DB.
- `GET /auth/session` na inicialização; `staleTime` de 5 min.
- Interceptor de resposta: `401 SESSION_EXPIRED` → limpa token, emite evento, redireciona para `/login?redirect=<rota atual>`.
- Expiração durante checkout preserva `redirect`; o carrinho vive no servidor, então o contexto não se perde.
- Logout: `POST /auth/logout` → `clearToken()` → `queryClient.clear()` → desconecta socket → navega para `/`.
- Troca de usuário: cache e subscriptions são descartados; cada evento `order.updated` carrega `userId` e o cliente ignora eventos de outra sessão.

---

## 6. Carrinho e dinheiro

- Visitante usa a chave `guest` no store do mock (persistida).
- No login, `POST /cart/merge` mescla o carrinho de visitante no do usuário e zera o guest.
- Preços sempre `string` decimal; soma/comparação com `decimal.js`; exibição formata a string sem passar por `float`.
- `Cart.version` incrementa em toda mutação **e** quando um NFT do carrinho muda de preço/estoque (`touchCartsContaining`).
- Cotação (`Quote`) carrega `version` e `hash`; o checkout compara com o carrinho e exige nova confirmação se divergir.

---

## 7. Cache e invalidação

| Evento | Efeito |
|---|---|
| Favorito | otimista em `favorites` + rollback em erro |
| Carrinho/cupom | invalida `cart` e `quote` |
| Pedido criado | invalida `orders`, `cart`; grava `order(id)` |
| `order.updated` | atualiza `order(id)` e invalida `orders`; em `confirmed`, invalida `cart` |
| `nft.updated` | aplica patch em `nfts` e `nft(id)`, invalida `cart` e **não** refaz a cotação (força nova confirmação) |
| Login/logout | `queryClient.clear()` + reset de stores privados |

Defaults: `staleTime` 30 s, `gcTime` 5 min, retry 1 para GET e 0 para mutation, `refetchOnWindowFocus: false`.

Respostas obsoletas: cada consulta usa `queryKey` isolada por parâmetro/usuário e recebe `AbortSignal` do Query; o catálogo usa `keepPreviousData` para não piscar na paginação.

---

## 8. Tempo real

- `socket.io-client` com `transports: ['websocket']`, auth por token e reconexão automática.
- O mock intercepta o WebSocket via MSW (`ws.link('*')` + `toSocketIo`), faz o handshake Engine.IO/Socket.IO e emite eventos de texto.
- Guarda de versão (`VersionGuard`): descarta `eventId` repetido (LRU 200) e `version <= última`.
- Eventos:
  - `nft.updated` `{ nftId, version, priceEth, editionsAvailable, status }`
  - `order.updated` `{ orderId, version, status, txHash?, declineReason? }`
  - `session.expired`
- Reconexão: `connect` → invalida catálogo, detalhe, carrinho, pedidos e pedido aberto (reconciliação REST).
- Ciclo de vida: listeners removidos no unmount; socket encerrado no logout.
- Heartbeat do Engine.IO é simulado (`'2'` a cada 20 s) para evitar queda por timeout.

**Limitações do mock:** namespace padrão, sem acknowledgements, sem binários, sem polling (apenas WebSocket). Documentado e suficiente para os eventos exigidos.

---

## 9. Mock DB

- Seed determinístico (PRNG com semente): 24 NFTs, 4 coleções, 2 usuários, 3 carteiras, 2 pedidos, 2 cupons.
- Persistência: `localStorage['jg.mock.db.v1']` com `schemaVersion` e `seed` (reset automático se divergir).
- Reset: limpar o storage ou usar o painel/endpoint; restaura o cenário conhecido.
- Controle de cenário: `localStorage['jg.mock.scenario']` (prioridade) e header `X-Mock-Scenario`.
- Latência: 120–280 ms no padrão, 2,5 s no `slow`, aleatória no `variable-latency`.
- Senhas: `SHA-256(salt + senha)`; nenhuma senha em claro.

---

## 10. Acessibilidade

- Skip link, foco visível global, `aria-live` em totais/estoque/status.
- Diálogos e drawers (Radix) prendem o foco e devolvem ao gatilho ao fechar.
- Campos com `label` + `aria-invalid` + `aria-describedby` apontando para a mensagem.
- Estados nunca dependem só de cor (texto + ícone).
- `prefers-reduced-motion` desativa shimmer e transições.
- Imagens relevantes com `alt`; imagens decorativas com `alt=""`.

---

## 11. Performance

Auditoria medida contra a URL publicada (Cloudflare), cenário `default`, mediana de 3 execuções:

| Perfil | Página | Perf | A11y | Boas práticas | SEO | LCP | CLS | TBT |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| desktop | início | 84 | 100 | 100 | 100 | 2,4 s | 0,001 | 533 ms |
| desktop | detalhe | 90 | 100 | 100 | 100 | 2,5 s | 0,000 | 323 ms |
| mobile | início | 84 | 100 | 100 | 100 | 2,4 s | 0,051 | 532 ms |
| mobile | detalhe | 91 | 100 | 100 | 100 | 2,4 s | 0,000 | 306 ms |

A11y, boas práticas e SEO atingem as metas (100). Performance ≥ 90 é atingida no
detalhe (90/91); o início fica em 84 por causa do hero com 4 imagens + 12 cards na
primeira dobra e do custo de boot do MSW (SPA sem SSR). O LCP ficou em 2,4–2,5 s.

O que foi corrigido: CLS do detalhe (0,352 → 0) e do início (0,118 → 0) ao alinhar
skeletons ao layout final; SEO 92 → 100 com `robots.txt`/`sitemap.xml`; rotas
secundárias em lazy loading (router 400 → 319 KB). O MSW sobe **antes** do app para
que o `socket.io-client` use o `WebSocket` interceptado — sem isso o tempo real
quebra em produção.

Remediação planejada: pré-render das rotas públicas, MSW sob demanda pós-paint,
`manualChunks` e imagens responsivas. Relatórios: `lighthouse/reports/`.

---

## 12. Testes

- Playwright com `webServer` apontando para o dev server e cenário determinístico por teste.
- Cada teste limpa `localStorage` (DB, token, carrinho) e recarrega: estado isolado.
- **52 testes** (43 desktop + 9 mobile), incluindo idempotência entre usuários,
  socket-drop/reconexão, pedido pendente após refresh, stale-events, clique repetido,
  registro, avatar, estoque por socket e compra no viewport mobile.
- Cobertura: catálogo/URL, detalhe/404, sessão, favoritos (rollback), carrinho/cupom/merge, compra completa, recusa/timeout/idempotência, tempo real, perfil/carteiras, teclado/foco, loading/erro, regressão visual.
- `trace: retain-on-failure`, vídeo e screenshot em falha; relatório HTML.

---

## 13. Desvios do Figma e limitações

| Item | Decisão |
|---|---|
| Assets | Figma em modo somente leitura; artes e avatares foram gerados localmente (SVG determinístico) |
| Tipografia | Space Grotesk (títulos) + Inter (texto); aproximação da identidade observada |
| Cores | Paleta escura com acento verde-limão (`#c8f45c`), extraída por aproximação visual |
| Telas ausentes no Figma | 404, estados vazios/erro, drawer do carrinho, seletor de rede e painel de cenários seguem o mesmo padrão |
| Mobile sem frame | Perfil, carteiras e confirmação foram desenhados de forma responsiva |
| Socket.IO | Namespace padrão, sem acks/binários, transporte WebSocket |
| Dados | Todos fictícios; hash de transação e explorador são simulados |
