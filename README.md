# GreenMint — NFT Marketplace

Desafio técnico Frontend da **Jungle Gaming**: marketplace de NFTs com React + TypeScript, APIs simuladas com MSW, tempo real com Socket.IO, testes E2E com Playwright e auditoria com Lighthouse.

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

## 8. Deploy (gratuito, sem Vercel)

O projeto é uma SPA estática. O `netlify.toml` já configura build, SPA fallback e cache.

**Netlify Drop (recomendado — sem CLI):**

```bash
npm run build
# arraste a pasta dist/ em https://app.netlify.com/drop
```

**Netlify via Git:** conecte o repositório; build `npm run build`, publish `dist`.

**GitHub Pages (alternativa):** exige `base` relativo ao nome do repositório, `serviceWorker.url` com `import.meta.env.BASE_URL`, `basepath` no router e cópia de `index.html` para `404.html`. Passo a passo em `CONTEXTO.md` §11.1.

Checklist pós-deploy: `/` com catálogo, `/nft/nft-03` direto, refresh em `/cart` e `/orders/...`, login, compra confirmada e `mockServiceWorker.js` respondendo 200.

---

## 9. Limitações conhecidas

- O mock de Socket.IO usa o namespace padrão e apenas eventos de texto (limitação do binding).
- O transporte é forçado para `websocket` (o polling do Engine.IO não é simulado).
- Assets visuais foram recriados localmente (o Figma era somente leitura); ver desvios em `ARCHITECTURE.md`.
- Datas e hashes são fictícios.
