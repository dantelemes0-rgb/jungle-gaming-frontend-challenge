# CONTEXTO — Kurio (Jungle Gaming Frontend Challenge)

> **Para o próximo agente:** leia este arquivo inteiro antes de agir. Ele descreve o que existe, como rodar, o que já foi validado, o que falta e quais regras não podem ser quebradas.
> Última atualização: **2026-10-29, 04:50** (horário local).
> Documento irmão: `ARCHITECTURE.md` (decisões técnicas detalhadas) e `README.md` (setup e uso).

---

## 1. Resumo executivo

| Item | Valor |
|---|---|
| Produto | **Kurio** — marketplace de NFTs (desafio técnico da Jungle Gaming) |
| Repositório | https://github.com/dantelemes0-rgb/jungle-gaming-frontend-challenge (**público**) |
| Branch principal | `main` (2 commits) |
| Caminho local | workspace do candidato |
| Stack | React 19 · TypeScript 5.9 · Vite 7 · TanStack Router/Query · Axios · Tailwind 4 · shadcn/ui · MSW 2.15 · socket.io-client · Playwright · Lighthouse |
| Estado | App completa e funcional; **52/52 testes E2E verdes** |
| Pendente | Lighthouse (pausado a pedido do candidato) |
| Prazo | entrega em **29/10/2026** |

Tudo é **simulado**: não há backend, blockchain, carteira ou pagamento real. O MSW é o "backend" e persiste em `localStorage`.

---

## 2. Regras invioláveis (acordadas com o candidato)

1. **Figma é somente leitura.** Nunca comentar, editar, duplicar ou exportar. (A sessão do usuário é viewer.)
2. **Nada de escrita no GitHub da Jungle** (`junglegaming/frontend-challenge`). O repo original está em `..\frontend-challenge` apenas como referência.
3. **Push só no repositório pessoal** `dantelemes0-rgb/jungle-gaming-frontend-challenge`, já criado e autorizado.
4. **Sem dados reais.** Usuários, carteiras, hashes e pagamentos são fictícios.
5. Artigos e código em **português técnico**; conversa com o candidato em **espanhol**.
6. Deploy em **Cloudflare** (Workers + Static Assets), gratuito, sem Vercel.

---

## 3. Como rodar

```bash
cd app
npm ci
npm run dev          # http://localhost:5173
```

Build de demonstração (mocks ativos por `.env`):

```bash
npm run build
npm run preview      # http://localhost:4173
```

Testes:

```bash
npx playwright install chromium
npm run test:e2e
```

> **Windows/PowerShell:** `npm` pode estar bloqueado pela execution policy. Use `npm.cmd` ou rode
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

> **OneDrive:** o projeto está dentro do OneDrive. Isso deixa `node_modules` lento. Recomendação para o próximo agente: manter **um único** `npm install` em `app/`; não instalar dependências nas worktrees.

---

## 4. Credenciais e dados fictícios

| Usuário | E-mail | Senha |
|---|---|---|
| Ana | `ana@jungle.test` | `jungle123` |
| Bruno | `bruno@jungle.test` | `jungle123` |

Cupons: `GREEN10` (10% de desconto) · `EXPIRED10` (expirado) · `INVALID` (inexistente).

Seed determinístico: **24 NFTs**, 4 coleções, 3 carteiras, 2 pedidos (1 confirmado, 1 recusado), 2 usuários.

---

## 5. Cenários de simulação (mock)

Seleção por URL (`?mock=<id>`) ou pelo painel flutuante no canto inferior esquerdo.
Troca em runtime: `POST /api/__mock/scenario`. Reset: `POST /api/__mock/reset` ou limpar `localStorage`.

| ID | Efeito |
|---|---|
| `default` | tudo ok, latência 120–280 ms |
| `empty-catalog` | catálogo vazio |
| `slow` | 2,5 s (skeletons) |
| `variable-latency` | latência aleatória (respostas fora de ordem) |
| `http-500` | 500 no catálogo |
| `offline` | falha de conexão |
| `session-expired` | 401 em rotas privadas |
| `register-conflict` | 409 no cadastro |
| `favorite-failure` | 500 no favorito (rollback) |
| `coupon-invalid` / `coupon-expired` | 422 / 410 |
| `price-changed` | `nft.updated` após conexão |
| `edition-sold-out` | estoque zera no checkout |
| `order-timeout` | pedido criado sem resposta |
| `payment-declined` | `order.updated` declined |
| `socket-drop` | queda + reconexão |
| `duplicate-events` / `stale-events` | duplicata / versão antiga |

Chaves de `localStorage`: `jg.mock.db.v1`, `jg.mock.scenario`, `jg.token`, `jg.checkout.idempotency`.

---

## 6. Arquitetura e mapa do código

```
app/
├─ src/
│  ├─ app/                 bootstrap, router, providers, query client
│  ├─ routes/              telas (createRoute) + guards
│  ├─ features/            catalog, cart, checkout, orders, auth, favorites, profile, wallets
│  ├─ shared/
│  │  ├─ api/              http.ts (Axios), contracts.ts (Zod), errors.ts, query-keys.ts
│  │  ├─ lib/              money.ts (decimal.js), format.ts, idempotency.ts, prng.ts, storage.ts
│  │  ├─ ui/               componentes shadcn (button, input, dialog, sheet, select…)
│  │  └─ components/       header, footer, nft-card, states, quantity-stepper, scenario-panel
│  ├─ mocks/
│  │  ├─ db/               seed.ts, store.ts, schema.ts
│  │  ├─ handlers/         account, catalog, cart, orders, control
│  │  ├─ socket/           index.ts (ws.link + toSocketIo), bus.ts
│  │  └─ scenarios.ts
│  └─ realtime/            socket.ts, version-guard.ts, use-realtime.ts
├─ e2e/                    helpers + 12 specs (+ baselines visuais)
├─ lighthouse/             lighthouserc.json
├─ scripts/                generate-art.mjs, lighthouse.mjs
├─ docs/contratos.md
├─ README.md · ARCHITECTURE.md
└─ vercel.json / netlify.toml
```

### Onde comprovar cada requisito

| Requisito do enunciado | Arquivo |
|---|---|
| Estado do catálogo na URL | `src/routes/home.tsx` + `catalogSearchSchema` em `src/shared/api/contracts.ts` |
| Filtros combináveis / reset de página | `src/features/catalog/filter-bar.tsx` |
| Busca paginada e ordenação | `src/mocks/handlers/catalog.ts` |
| Detalhe, 404, esgotado, limite | `src/routes/nft-detail.tsx` |
| Favoritos otimistas + rollback | `src/features/favorites/hooks.ts` |
| Carrinho, cupom, merge visitante | `src/mocks/handlers/cart.ts` + `src/features/cart/hooks.ts` |
| Dinheiro exato (string + decimal.js) | `src/shared/lib/money.ts` |
| Cotação + revalidação | `src/features/checkout/hooks.ts` + `src/mocks/handlers/orders.ts` |
| Idempotência | `src/shared/lib/idempotency.ts` + `POST /api/orders` |
| Pedido pendente → confirmado/recusado | `src/routes/order.tsx` + `settleOrder` em `src/mocks/db/store.ts` |
| Recibo imutável (snapshot) | `src/routes/order.tsx` + `Order.items` |
| Sessão recuperável / expiração | `src/features/auth/*` + interceptores em `src/shared/api/http.ts` |
| Isolamento por usuário | `queryKeys` por `userId` + `src/realtime/use-realtime.ts` + logout |
| Tempo real versionado | `src/realtime/version-guard.ts` |
| Reconciliação após reconexão | `handleConnect` em `src/realtime/use-realtime.ts` |
| MSW com estado e cenários | `src/mocks/db/store.ts` + `src/mocks/scenarios.ts` |
| Socket.IO mockado | `src/mocks/socket/index.ts` |
| Acessibilidade | componentes Radix + `aria-*` em formulários e `aria-live` |
| Performance | code splitting (imports dinâmicos no `main.tsx`/`router`), SVGs locais, fontes self-hosted |

---

## 7. Decisões técnicas que não devem ser desfeitas

| ID | Decisão | Motivo |
|---|---|---|
| ADR-001 | **MSW 2.15.0** fixo | `@mswjs/socket.io-binding@0.2.0` exige peer `^2.10.2`; MSW 3 quebra o handshake |
| ADR-002 | Vite 7 + React 19 + TS 5.9 | estabilidade; TS 7 é recente |
| ADR-004 | ETH como string + `decimal.js` | precisão exigida |
| ADR-005 | URL como fonte de verdade | refresh/histórico |
| ADR-006 | Assets SVG locais gerados | Figma sem export + performance |
| ADR-008 | Rotas **code-based** (`createRoute`) | sem codegen; build limpo |
| ADR-010 | DB do mock em `localStorage` versionado | refresh sem backend |

Detalhes e histórico em `ARCHITECTURE.md`.

---

## 8. Tempo real (pontos sensíveis)

- Cliente: `socket.io-client` com `transports: ['websocket']` (o mock não simula polling).
- Mock: `ws.link('*')` + `toSocketIo(connection)`; heartbeat Engine.IO é enviado a cada 20 s.
- Eventos: `nft.updated`, `order.updated`, `session.expired`.
- Guarda de versão: descarta `eventId` repetido e `version <= última`.
- Em `nft.updated`: invalida o carrinho **e não** refaz a cotação de propósito — o checkout precisa exigir nova confirmação.
- `touchCartsContaining(nftId)` incrementa `cart.version` quando um NFT do carrinho muda de preço.
- Reconexão: `connect` → invalida catálogo, detalhe, carrinho e pedidos.
- Logout: `socket.removeAllListeners()` + `disconnect()` + `queryClient.clear()`.

**Limitações do binding:** namespace padrão, sem acknowledgements, sem binários.

---

## 9. Testes — estado atual

| Suíte | Resultado |
|---|---|
| Desktop (fluxos) | 22/22 ✅ |
| Visual (desktop + mobile) | 8/8 ✅ |
| **Total** | **52/52 ✅** |

Specs: `catalog`, `detail`, `auth`, `favorites`, `cart`, `purchase`, `checkout-failures`, `realtime`, `account`, `a11y`, `loading`, `visual`.

Comandos:

```bash
npm run test:e2e
npm run test:e2e:ui
npx playwright show-report
```

Baselines visuais foram geradas em **Windows** (`*-win32.png`). Em Linux/CI, regenere com
`npx playwright test e2e/visual.spec.ts --update-snapshots`.

### Armadilhas de teste já resolvidas (não reintroduzir)

1. `resetApp` limpa `localStorage` e recarrega — **não** chama `/api/__mock/reset` (gerava corrida).
2. `addToCart` espera a resposta `POST /api/cart/items` e a persistência no `localStorage`.
3. Mutations otimistas exigem esperar a resposta (PUT/PATCH) antes de recarregar a página.
4. `nft-07` e `nft-18` estão **esgotados** no seed.
5. Baselines são por SO.

---

## 10. Problemas de ambiente já encontrados

| Sintoma | Causa | Solução |
|---|---|---|
| `npm` bloqueado no PowerShell | execution policy `Restricted` | usar `npm.cmd` ou `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| 502 ao abrir `localhost` no navegador do app | Vite escutando só em `::1` | `server.host: '0.0.0.0'` no `vite.config.ts` (já aplicado) |
| Erro `Missing parameter name at 9` | `ws.link(regex)` + baseUrl IPv6 | usar `ws.link('*')` (já aplicado) |
| `subscribeRealtime is not defined` | import faltando no mock de socket | importar de `./bus` (já corrigido) |
| Cartão vazio após navegar | navegação antes do fim da mutation | helpers de teste aguardam a resposta |
| Merge do carrinho não acontecia | navegação antes do `POST /cart/merge` | merge movido para dentro do `mutationFn` |

---

## 11. O que falta (ordem sugerida)

### 11.1 Deploy gratuito (obrigatório no enunciado) — ✅ CONCLUÍDO

> **Atenção:** o enunciado **não exige Netlify**. Exige **URL pública**. Netlify, Vercel e
> Cloudflare Pages são aceitos. Regra completa: `CONSIGNAS.md` §1 e §6.

**Produção:** https://greenmint-marketplace-app.jungle-marketplace.workers.dev
(Cloudflare Workers + Static Assets, SPA com status 200 em todas as rotas)

**Backup:** https://greenmint-marketplace.pages.dev (Cloudflare Pages; deep link renderiza com 404 de status)

Comando de deploy:

```bash
npm run build
npx wrangler deploy -c wrangler.workers.jsonc
```

**Opção A — Netlify Drop (mais rápida, sem CLI, sem Vercel)**

1. Rodar `npm run build` em `app/`.
2. Abrir https://app.netlify.com/drop e arrastar a pasta `dist/` (ou o ZIP em `deploy/`).
3. Criar conta gratuita (login com GitHub) para o site permanecer.
4. Copiar a URL pública (ex.: `https://greenmint-xxxx.netlify.app`).
5. Testar: `/nft/nft-03` direto, refresh, mocks e socket.

O `netlify.toml` já configura build, publish, SPA fallback e cache.

**Opção B — GitHub Pages (100% dentro da conta, sem terceiros)**

Requer ajustes de `base`:
- `vite.config.ts`: `base: process.env.GITHUB_PAGES ? '/jungle-gaming-frontend-challenge/' : '/'`
- `src/mocks/browser.ts`: `serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` }`
- Router: `basepath: import.meta.env.BASE_URL`
- Copiar `index.html` para `404.html` no build (fallback de rotas).

Custo: ~30 min e risco de regressão em deep links/service worker. Só usar se a Opção A for recusada.

**Validação pós-deploy (checklist):**

- [ ] `/` carrega com catálogo (24 itens)
- [ ] `/nft/nft-03` abre direto
- [ ] refresh em `/cart` e `/orders/...`
- [ ] login funciona
- [ ] compra confirma (socket + polling)
- [ ] `mockServiceWorker.js` responde 200 na raiz do site

### 11.2 Lighthouse

```bash
npm run build
npm run preview          # em outro terminal
npm run audit:lighthouse
```

Metas: Performance ≥ 90 · A11y ≥ 95 · BP ≥ 95 · SEO ≥ 90.
O script grava HTML/JSON + `lighthouse/reports/summary.md` (mediana de 3 execuções).

### 11.3 Guia HTML de estudo

Criar `docs/guia-de-estudo.html` com:
- mapa do código e “onde comprovar cada requisito” (seção 6 acima);
- trechos explicados (idempotência, cotação, guarda de versão, dinheiro);
- perguntas e respostas para entrevista;
- roteiro de demonstração de 5–10 minutos.

### 11.4 Fidelidade visual

Tokens foram **estimados** (Figma viewer, sem export). Revisar cores/tipografia/medidas contra os 15 frames e registrar desvios em `ARCHITECTURE.md` §13.

---

## 12. Git, branches e worktrees

```
app/                            main (integração)
worktrees/foundation            feat/foundation
worktrees/commerce              feat/commerce
worktrees/realtime              feat/realtime
worktrees/qa                    feat/qa
```

- Commits em Conventional Commits (pt-BR).
- Remote: `origin` → repo pessoal (push autorizado).
- `node_modules` só em `app/`.
- Worktrees são cópias do mesmo commit; servem para trabalho paralelo por agentes.

---
