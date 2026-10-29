# Como avaliar (guia rápido)

Duas formas de avaliar a entrega: **rodando localmente** (recomendado para inspeção de código)
e **na URL publicada** (exigida pelo enunciado). O comportamento é idêntico: os mocks rodam no navegador.

---

## 1. Rodar localmente (3 minutos)

```bash
git clone https://github.com/dantelemes0-rgb/jungle-gaming-frontend-challenge.git
cd jungle-gaming-frontend-challenge
npm ci
npm run dev
```

Abrir `http://localhost:5173`.

> Requisitos: Node.js ≥ 20.19 (testado com 24.19) e npm.
> Os mocks já vêm habilitados por `.env` (`VITE_ENABLE_MOCKS=true`).

### Credenciais fictícias

| Usuário | E-mail | Senha |
|---|---|---|
| Ana | `ana@jungle.test` | `jungle123` |
| Bruno | `bruno@jungle.test` | `jungle123` |

Cupons: `GREEN10` (10%) · `EXPIRED10` (expirado) · `INVALID` (inexistente).

---

## 2. Roteiro de avaliação manual (10 passos)

| # | Ação | Resultado esperado |
|---:|---|---|
| 1 | Buscar “Jardim”, filtrar por raridade e ordenar por menor preço | URL muda (`q`, `rarity`, `sort`); refresh e botão voltar preservam |
| 2 | Abrir `/nft/nft-999` | Estado “NFT não encontrado” com retorno ao catálogo |
| 3 | Abrir `/nft/nft-03`, aumentar quantidade, adicionar ao carrinho | Drawer abre com o item e o total |
| 4 | Ir ao carrinho, aplicar `INVALID` e depois `GREEN10` | “Cupom inválido.” e depois desconto de 10% |
| 5 | Refresh no carrinho | Itens e cupom permanecem |
| 6 | Finalizar compra → revisar → marcar confirmação → confirmar | Pedido **Pendente** e depois **Confirmado**, com hash e recibo |
| 7 | Cenário `order-timeout` → comprar → confirmar duas vezes | Primeiro erro de conexão; o segundo recupera o **mesmo** pedido |
| 8 | Cenário `payment-declined` → comprar | Pedido **Recusado**; itens continuam no carrinho |
| 9 | Com item no carrinho, abrir checkout e disparar `nft.updated` (cenário `price-changed` ou painel) | Aviso de valores alterados e confirmação bloqueada até atualizar |
| 10 | Sair de Ana, entrar como Bruno e abrir o carrinho | Carrinho vazio; nenhum dado de Ana aparece |

### Como disparar os cenários

- Painel flutuante no canto inferior esquerdo (**“Cenário: …”**), ou
- URL: `http://localhost:5173/?mock=price-changed`, ou
- `POST /api/__mock/scenario` com `{ "scenario": "..." }`.

Reset: botão **“Resetar dados do cenário”** ou limpar o `localStorage` (chaves `jg.*`).

---

## 3. O que inspecionar no código

| Requisito | Arquivo |
|---|---|
| Estado do catálogo na URL | `src/routes/home.tsx` + `catalogSearchSchema` em `src/shared/api/contracts.ts` |
| Contratos tipados | `src/shared/api/contracts.ts` |
| Axios + interceptores | `src/shared/api/http.ts` |
| Dinheiro exato | `src/shared/lib/money.ts` |
| Idempotência | `src/shared/lib/idempotency.ts` + `src/mocks/handlers/orders.ts` |
| Cotação e revalidação | `src/features/checkout/hooks.ts` + `src/mocks/handlers/orders.ts` |
| Tempo real / versões | `src/realtime/version-guard.ts` + `src/realtime/use-realtime.ts` |
| Socket.IO mockado | `src/mocks/socket/index.ts` |
| Store e cenários | `src/mocks/db/store.ts` + `src/mocks/scenarios.ts` |
| Sessão e isolamento | `src/features/auth/hooks.ts` |
| Testes | `e2e/*.spec.ts` |
| Decisões e limitações | `ARCHITECTURE.md` |
| Consignas e conformidade | `CONSIGNAS.md` |

---

## 4. Testes automatizados

```bash
npx playwright install chromium
npm run test:e2e        # 52 testes (43 desktop + 9 mobile)
npm run test:e2e:ui
npx playwright show-report
```

Cobertura: catálogo/URL, detalhe/404, sessão, favoritos com rollback, carrinho/cupom/merge,
compra completa, recusa/timeout/idempotência, tempo real, perfil/carteiras, teclado/foco,
loading/erro e regressão visual (desktop + mobile).

> Baselines visuais foram geradas em Windows. Em Linux/CI:
> `npx playwright test e2e/visual.spec.ts --update-snapshots`.

---

## 5. Verificações de qualidade

```bash
npm run typecheck
npm run lint
npm run build
npm run preview

# auditoria (com o preview rodando em outro terminal)
npm run audit:lighthouse
```

Metas: Performance ≥ 90 · Acessibilidade ≥ 95 · Boas práticas ≥ 95 · SEO ≥ 90.

---

## 6. URL publicada

O enunciado exige **URL pública** (§12) e o formulário de entrega marca o campo
“Link da aplicação” como obrigatório. O guia de deploy (opções gratuitas) está em
README §8; a configuração do Netlify está em `netlify.toml`.

Checklist do ambiente publicado:

- [ ] `/` carrega o catálogo
- [ ] `/nft/nft-03` abre por acesso direto
- [ ] refresh em `/cart` e `/orders/...`
- [ ] login e compra funcionam
- [ ] `mockServiceWorker.js` responde 200
- [ ] eventos de tempo real conectam
