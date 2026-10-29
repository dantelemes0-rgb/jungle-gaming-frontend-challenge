# Kurio — NFT Marketplace

**Demo publicada:** https://greenmint-marketplace-app.jungle-marketplace.workers.dev
**Repositório:** https://github.com/dantelemes0-rgb/jungle-gaming-frontend-challenge

Desafio técnico Frontend da **Jungle Gaming**: marketplace de NFTs com React + TypeScript, APIs simuladas com MSW, tempo real com Socket.IO, testes E2E com Playwright e auditoria com Lighthouse.

> **Consignas do desafio (fonte de verdade): [`CONSIGNAS.md`](./CONSIGNAS.md).**
> Decisões e limitações: [`ARCHITECTURE.md`](./ARCHITECTURE.md). Guia de avaliação: [`COMO-AVALIAR.md`](./COMO-AVALIAR.md).

> **Tudo é simulado.** Não há blockchain, carteira real, pagamento real ou backend externo. O mock roda na camada de rede (MSW) e persiste em `localStorage`.

---

## 1. Stack

| Camada | Tecnologia |
|---|---|
| UI | React 19 + TypeScript 5.9 |
| Build | Vite 7 |
| Rotas | TanStack Router (rotas tipadas + `validateSearch`) |
| Estado remoto | TanStack Query 5 |
| HTTP | Axios (instância única) |
| Estilo | Tailwind CSS 4 |
| Componentes | shadcn/ui (Radix) re-tematizado |
| Mock de rede | MSW **2.15** + `@mswjs/socket.io-binding` |
| Tempo real | `socket.io-client` |
| Formulários | react-hook-form + Zod 4 |
| Dinheiro | `decimal.js` (ETH como string decimal) |
| E2E / visual | Playwright |
| Performance | Lighthouse |

**Por que MSW 2.15 e não 3.x?** O `@mswjs/socket.io-binding@0.2.0` declara peer `msw ^2.10.2`; a versão 3 quebra a integração. A decisão está registrada em `ARCHITECTURE.md` (ADR-001).

---

## 2. Rodando localmente

```bash
npm ci
npm run dev          # http://localhost:5173
```

O arquivo `.env` já habilita os mocks:

```env
VITE_ENABLE_MOCKS=true
```

Build de demonstração (mocks ativos por padrão):

```bash
npm run build
npm run preview      # http://localhost:4173
```

> **Windows/PowerShell:** se `npm` estiver bloqueado por execution policy, use `npm.cmd` ou rode
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

---

## 3. Credenciais fictícias

| Usuário | E-mail | Senha |
|---|---|---|
| Ana | `ana@jungle.test` | `jungle123` |
| Bruno | `bruno@jungle.test` | `jungle123` |

As senhas são armazenadas no mock com **SHA-256 + salt** (WebCrypto), nunca em texto claro.
Cupons: `GREEN10` (10% de desconto) e `EXPIRED10` (expirado).

---

## 4. Cenários de simulação

Selecione no painel flutuante **“Cenário: …”** (canto inferior esquerdo) ou via URL:

```
http://localhost:5173/?mock=price-changed
```

| Cenário | O que faz |
|---|---|
| `default` | tudo funcionando, latência baixa |
| `empty-catalog` | catálogo vazio |
| `slow` | 2,5 s de latência (skeletons) |
| `variable-latency` | latência aleatória (respostas fora de ordem) |
| `http-500` | erro no catálogo |
| `offline` | falha de conexão |
| `session-expired` | 401 em rotas privadas |
| `register-conflict` | conflito de e-mail no cadastro |
| `favorite-failure` | 500 no favorito (rollback otimista) |
| `coupon-invalid` / `coupon-expired` | 422 / 410 no cupom |
| `price-changed` | `nft.updated` após abrir a conexão |
| `edition-sold-out` | estoque zera no checkout |
| `order-timeout` | pedido criado sem resposta (idempotência) |
| `payment-declined` | `order.updated` recusado |
| `socket-drop` | queda do socket com reconexão |
| `duplicate-events` | mesmo evento duas vezes |
| `stale-events` | evento antigo após um novo |

**Reset**: botão “Resetar dados do cenário” no painel, ou limpe o `localStorage` e recarregue.
Chaves: `jg.mock.db.v1` (base), `jg.mock.scenario`, `jg.token`, `jg.checkout.idempotency`.

---

## 5. Fluxos para testar manualmente

1. **Catálogo**: busque “Jardim”, combine filtros (raridade + preço), ordene por menor preço, mude de página e recarregue — o estado está na URL.
2. **Compra**: abra um NFT → adicione 2 unidades → carrinho (aplique `GREEN10`) → checkout → revisão → confirmar → aguarde **Confirmado** e confira o recibo com hash.
3. **Idempotência**: cenário `order-timeout` → confirmar → aparece erro de conexão → confirmar de novo → o **mesmo** pedido é recuperado (sem duplicar).
4. **Tempo real**: com um NFT no carrinho, abra o checkout e dispare `POST /api/__mock/price-change` (ou use `?mock=price-changed`) → a cotação fica desatualizada, a UI avisa e bloqueia a confirmação.
5. **Sessão**: faça login, recarregue (sessão persiste), ative `session-expired` e navegue para `/checkout` → volta ao login com `redirect` preservado.
6. **Isolamento**: adicione itens como Ana, saia, entre como Bruno → carrinho vazio.

---

## 6. Comandos

```bash
npm run dev               # desenvolvimento com mocks
npm run build             # build de produção (mocks habilitados)
npm run preview           # serve o build
npm run typecheck         # tsc -b
npm run lint              # oxlint
npm run test:e2e          # Playwright (desktop + mobile)
npm run test:e2e:ui       # modo UI
npm run audit:lighthouse  # auditoria (build + preview)
```

Relatórios: `playwright-report/` (HTML) e `test-results/` (traces em falha).

> **Baselines visuais** foram geradas em Windows (`*-win32.png`). Em CI Linux, rode
> `npx playwright test e2e/visual.spec.ts --update-snapshots` para gerar as baselines do runner.

---

## 7. Estrutura

```
src/
├─ app/          bootstrap, router, providers, query client
├─ routes/       telas (createRoute) + guards
├─ features/     catalog, nft, cart, checkout, orders, auth, favorites, profile, wallets
├─ shared/       api (Axios + contratos), lib (money, format), ui (shadcn), components
├─ mocks/        db, handlers, scenarios, socket (MSW)
└─ realtime/     socket.io-client, version guard, reconciliação
e2e/             specs Playwright + fixtures
lighthouse/      configuração e relatórios
```

Contratos REST e eventos: `docs/contratos.md`.
Decisões, cache, sessão e limitações: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 8. Deploy (Cloudflare, gratuito)

Publicado em **Cloudflare Workers + Static Assets** (SPA nativa, todas as rotas com status 200):

- Produção: **https://greenmint-marketplace-app.jungle-marketplace.workers.dev**

```bash
npm run build
npx wrangler deploy -c wrangler.workers.jsonc
```

O `wrangler.workers.jsonc` usa `not_found_handling: "single-page-application"`, então
deep link e refresh funcionam com 200. Os headers de segurança vêm de `public/_headers`
(copiado para `dist/`).

**Alternativa (Cloudflare Pages):** `https://greenmint-marketplace.pages.dev` — publicada com
`npx wrangler pages deploy dist --project-name=greenmint-marketplace`. Em Pages, o fallback SPA
usa `404.html` (a rota renderiza, mas com status 404); por isso a URL de produção é a de Workers.

**Netlify (alternativa):** arraste `dist/` em https://app.netlify.com/drop.

Checklist pós-deploy: `/` com catálogo, `/nft/nft-03` direto, refresh em `/cart` e `/orders/...`,
login, compra confirmada e `mockServiceWorker.js` respondendo 200.

**GitHub Pages (alternativa):** exige `base` relativo ao nome do repositório, `serviceWorker.url` com `import.meta.env.BASE_URL`, `basepath` no router e cópia de `index.html` para `404.html`. Passo a passo na seção 8.

Checklist pós-deploy: `/` com catálogo, `/nft/nft-03` direto, refresh em `/cart` e `/orders/...`, login, compra confirmada e `mockServiceWorker.js` respondendo 200.

---

## 9. Performance (Lighthouse)

Auditoria contra a **URL publicada** (Cloudflare, com compressão), cenário `default`,
3 execuções por página/perfil (mediana). Relatórios em `lighthouse/reports/`.
Medir no `vite preview` local (sem compressão) costuma dar 4–8 pontos menos.

| Perfil | Página | Performance | A11y | Boas práticas | SEO | LCP | CLS | TBT |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| desktop | início | 84 | 100 | 100 | 100 | 2,4 s | 0,001 | 533 ms |
| desktop | detalhe | 90 | 100 | 100 | 100 | 2,5 s | 0,000 | 323 ms |
| mobile | início | 84 | 100 | 100 | 100 | 2,4 s | 0,051 | 532 ms |
| mobile | detalhe | 91 | 100 | 100 | 100 | 2,4 s | 0,000 | 306 ms |

**Metas:** A11y, Boas práticas e SEO **atingidas (100)**. Performance ≥ 90 **atingida no
detalhe** (90 desktop / 91 mobile) e em **84 no início** — o hero com 4 imagens + 12 cards
e o boot do MSW explicam o desvio da home (o enunciado permite justificar desvios).

**Causas:**
1. SPA sem SSR: o HTML inicial é vazio; o LCP depende de baixar e executar o JS.
2. MSW no build de demonstração (requisito): ~107 KB gzip extras no boot.
3. Hero com 4 imagens + 12 cards na primeira dobra disputam o thread principal.
4. TBT: parse/execução dos chunks (router ~130 KB gzip, MSW ~107 KB gzip).

**Já corrigido:** CLS do detalhe 0,352 → 0; CLS do início 0,118 → 0; SEO 92 → 100
(`robots.txt` + `sitemap.xml`); rotas secundárias em lazy loading (router 400 → 319 KB);
skeletons alinhados ao layout final.

**Remediação fora do escopo:** pré-render/SSG das rotas públicas, MSW sob demanda
pós-paint, `manualChunks` para vendor e imagens responsivas (AVIF/WebP).

```bash
npm run build
npm run audit:lighthouse   # 3 execuções por página/perfil + resumo com mediana
```

---

## 10. Limitações conhecidas

- O mock de Socket.IO usa o namespace padrão e apenas eventos de texto (limitação do binding).
- O transporte é forçado para `websocket` (o polling do Engine.IO não é simulado).
- Assets visuais foram recriados localmente (o Figma era somente leitura); ver desvios em `ARCHITECTURE.md`.
- Datas e hashes são fictícios.
