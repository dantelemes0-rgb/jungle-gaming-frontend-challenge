# CONSIGNAS — o que o desafio exige (fonte de verdade)

> **Leia sempre antes de decidir qualquer coisa sobre escopo, entrega ou deploy.**
> Fonte: `frontend-challenge/README.md` (enunciado oficial) + formulário de entrega.
> Este arquivo **não substitui** o enunciado; ele traduz e rastreia cada exigência.

Última revisão: 2026-10-29.

---

## 1. Entrega: o que é obrigatório

Trecho literal do enunciado (§12):

> “O **deploy é obrigatório**. Envie o link do repositório e uma URL pública da aplicação.
> Recomenda-se **Vercel**; **Netlify** e **Cloudflare Pages** também são aceitos.”

> “A versão publicada deve corresponder ao código entregue e permanecer acessível durante a
> avaliação, com os mocks e os fluxos de tempo real funcionando. Acesso direto e refresh das
> rotas devem funcionar no ambiente publicado.”

> “A entrega deve executar a partir de um checkout limpo, sem depender de serviços privados
> ou do backend de produção.”

### Conclusão (importante)

| Pergunta | Resposta |
|---|---|
| Netlify é obrigatório? | **Não.** Netlify é apenas **uma** opção aceita. |
| Vercel é obrigatório? | **Não.** É “recomendado”, não exigido. |
| Publicar a aplicação é obrigatório? | **Sim.** Sem URL pública a entrega está incompleta. |
| Só o repositório basta? | **Não.** O formulário pede repositório **e** aplicação publicada. |
| GitHub Pages vale? | **Atende ao critério de “URL pública”, mas não está na lista de provedores citados no enunciado.** Usar apenas como último recurso; preferir Netlify ou Cloudflare Pages. |
| Repositório precisa ser acessível? | **Sim.** Público ou com acesso ao time. O nosso é **público**. |

### O que o formulário de entrega pede

| Campo | Obrigatório | Nosso valor |
|---|---|---|
| E-mail da candidatura | Sim | (e-mail usado no processo) |
| Link do repositório | Sim | `https://github.com/dantelemes0-rgb/jungle-gaming-frontend-challenge` |
| Link da aplicação | **Sim** | https://greenmint-marketplace-app.jungle-marketplace.workers.dev (Cloudflare) |
| Observações | Não | opcional |

Formulário: https://entrevistas.45-55-130-35.sslip.io/testes/front-remoto

---

## 2. Stack obrigatória (uso efetivo)

| Responsabilidade | Tecnologia | Onde está | Status |
|---|---|---|---|
| Interface | React | `src/routes`, `src/features` | ✅ |
| Linguagem | TypeScript | todo o `src` | ✅ |
| Roteamento | TanStack Router | `src/app/router.tsx`, `src/routes/*` | ✅ |
| Estado remoto | TanStack Query | `src/features/**/hooks.ts` | ✅ |
| Cliente HTTP | Axios | `src/shared/api/http.ts` | ✅ |
| Integração | REST | `src/mocks/handlers/*` | ✅ |
| Tempo real | Socket.IO | `src/realtime/*`, `src/mocks/socket/*` | ✅ |
| Estilização | Tailwind CSS | `src/styles.css` | ✅ |
| Componentes | shadcn/ui | `src/shared/ui/*` | ✅ |
| Mocking | MSW | `src/mocks/*` | ✅ |
| E2E + visual | Playwright | `e2e/*` | ✅ |
| Auditoria | Lighthouse | `lighthouse/*`, `scripts/lighthouse.mjs` | ⏳ falta rodar |

---

## 3. Telas e fluxos exigidos

| Tela | O que precisa ter | Onde | Status |
|---|---|---|---|
| Início | destaques, catálogo, busca, filtros, ordenação, navegação | `src/routes/home.tsx` | ✅ |
| Detalhes do NFT | galeria, informações, edição, quantidade, favoritos, compra | `src/routes/nft-detail.tsx` | ✅ |
| Carrinho | quantidades, remoção, cupom, resumo | `src/routes/cart.tsx` | ✅ |
| Pagamento | dados, carteira, rede, revisão, envio | `src/routes/checkout.tsx` | ✅ |
| Confirmação | resultado, transação, itens, taxas, total | `src/routes/order.tsx` | ✅ |
| Login | autenticação, validação, retorno ao fluxo | `src/routes/login.tsx` | ✅ |
| Cadastro | criação, validação, conflito | `src/routes/register.tsx` | ✅ |
| Perfil | dados, avatar, senha | `src/routes/profile.tsx` | ✅ |
| Carteiras | principal e secundária | `src/routes/wallets.tsx` | ✅ |
| Mobile | 390 / 768 / 1440 | Tailwind + breakpoints | ✅ (revisar fidelidade) |

Fora do escopo (não entregar): páginas editoriais, suporte, atividade, ofertas, downloads.
Ações fora do escopo não podem aparentar sucesso funcional.

---

## 4. Comportamentos que valem pontos (checklist técnico)

### Catálogo e detalhe
- [x] busca, filtros, ordenação e paginação na **URL** (refresh + histórico)
- [x] filtros combináveis; mudança de filtro reinicia a paginação
- [x] consultas refletem os parâmetros enviados à API
- [x] vazio, falha, respostas fora de ordem
- [x] detalhe com acesso direto, inexistente, esgotado, limite de quantidade
- [x] favoritos persistidos por usuário

### Carrinho
- [x] adicionar/alterar/remover respeitando disponibilidade
- [x] permanece após refresh
- [x] itens do visitante preservados após login
- [x] cupom válido/inválido/expirado
- [x] subtotal, desconto, taxa e total coerentes com a API
- [x] ETH como **string decimal**, quantidade inteira
- [x] reflete mudança de preço/estoque com o carrinho aberto

### Pagamento e confirmação
- [x] validação dos campos + revisão antes do envio
- [x] carteiras cadastradas + seleção de rede
- [x] revalidação de preço/estoque/cupom/taxas antes de confirmar
- [x] mudança exige nova confirmação
- [x] impede pedido duplicado (clique repetido e timeout)
- [x] pedido pendente/confirmado/recusado com recuperação após refresh
- [x] confirmação só após resposta da simulação
- [x] itens preservados em falha; remove só o comprado após confirmar
- [x] recibo é snapshot imutável

### Conta e sessão
- [x] cadastro, login, logout e sessão na API simulada
- [x] checkout, perfil, carteiras, favoritos e pedidos exigem autenticação
- [x] sessão recuperável após refresh
- [x] expiração durante navegação e checkout (com retorno)
- [x] logout/troca limpam cache e subscriptions
- [x] validação de formulários + erros da API
- [x] senhas com hash (nunca em claro)

### Integração e estado
- [x] contratos tipados (Zod + TS)
- [x] loading, vazio, erro, sucesso e atualização em segundo plano
- [x] invalidação coerente após mutations/eventos
- [x] cancelamento/descarte de respostas obsoletas
- [x] isolamento por usuário e por parâmetros
- [x] rota inexistente (404) e acesso direto
- [x] atualização otimista com rollback (favoritos)
- [x] política de cache/retries documentada (`ARCHITECTURE.md`)

### Mocking (MSW)
- [x] mocks na camada de rede (nada de dados em componente/hook)
- [x] estado consistente entre catálogo, favoritos, carrinho, perfil, carteiras, pedidos
- [x] persistência local + reset para cenário conhecido
- [x] lentidão, latência variável, timeout, offline, 4xx/5xx
- [x] ≥ 2 usuários e fixtures para filtros/paginação
- [x] cenários determinísticos (18)
- [x] Socket.IO simulado via binding; `socket.io-client` real
- [x] mocks ativos por configuração e no build de demonstração

### Tempo real
- [x] `nft.updated` (catálogo, detalhe, carrinho)
- [x] `order.updated` (confirmação/recusa)
- [x] identidade + versão nos eventos
- [x] tolera duplicatas e eventos antigos
- [x] reconciliação REST após reconexão
- [x] eventos não cruzam sessões
- [x] listeners liberados no fim do ciclo de vida
- [x] cenário preço/estoque mudando no checkout

### Interface, responsividade e a11y
- [x] fidelidade ao Figma (tokens **estimados**; revisar)
- [x] 390 / 768 / 1440
- [x] skeletons com shimmer + dimensões reservadas
- [x] teclado, foco visível, foco em diálogos/drawers
- [x] labels, erros associados, `aria-live`
- [x] alt significativo, contraste, estados não só por cor
- [x] sem overflow horizontal; reduced motion
- [ ] documentar substituição de assets (parcial em `ARCHITECTURE.md` §13)

### Testes (Playwright)
- [x] 12 blocos cobertos (`e2e/*.spec.ts`)
- [x] Chromium desktop + mobile
- [x] regressão visual de início, detalhe, carrinho e pagamento
- [x] baselines versionadas (Windows)
- [x] estado isolado por teste
- [x] relatório HTML + traces em falha
- [x] tempo real via cliente Socket.IO; REST via MSW

### Performance (Lighthouse)
- [ ] 3 medições por página/perfil; mediana documentada
- [ ] metas: P ≥ 90 · A ≥ 95 · BP ≥ 95 · SEO ≥ 90
- [ ] LCP/CLS/TBT registrados e desvios justificados

### Entrega
- [x] código, lockfile, assets, mocks, fixtures, testes e configs
- [x] repositório público acessível
- [ ] **URL pública da aplicação** ← único bloqueio da entrega
- [ ] `mockServiceWorker.js` e tempo real funcionando no ambiente publicado
- [x] `README.md` com setup, env, credenciais, cenários, reset e comandos
- [x] `ARCHITECTURE.md` com contratos, sessão, carrinho, cache, reconciliação e desvios
- [ ] `docs/guia-de-estudo.html`

---

## 5. Critérios eliminatórios (revisar antes de enviar)

| Eliminatório | Como estamos | Prova |
|---|---|---|
| Não usar a stack de verdade | ✅ | `package.json` + código de cada camada |
| Fluxos só visuais | ✅ | toda ação chama Axios/MSW |
| Compra confirmada sem resposta da simulação | ✅ | `POST /orders` → `order.updated`/`GET` |
| Exposição de dados entre usuários | ✅ | query keys por usuário + logout limpa tudo |
| Eventos simulados direto na UI | ✅ | `socket.io-client` real + binding no MSW |
| Ausência de E2E executável | ✅ | 52/52 verdes |

---

## 6. Deploy: opções aceitas (escolher uma)

| Opção | Custo | Conta necessária | Risco | Observação |
|---|---|---|---|---|
| **Netlify Drop** | grátis | login GitHub | baixo | arrastar `dist/`; `netlify.toml` pronto |
| **Cloudflare Pages** | grátis | login Cloudflare | baixo | aceito pelo enunciado |
| **GitHub Pages** | grátis | a conta que já existe | médio | exige `base`, `basepath`, `404.html` e ajuste do service worker |
| Vercel | grátis (Hobby) | conta Vercel | baixo | candidato **não possui** conta |

**Recomendação:** Netlify Drop (2 minutos, sem CLI, sem cartão). É gratuito e está na lista de
provedores aceitos pelo enunciado. Se a preferência for não criar conta em terceiros, avaliar
GitHub Pages **como último recurso** (não citado no enunciado) com os ajustes da §11.1 do `CONTEXTO.md`.

---

## 7. Definição de “entrega concluída”

1. `main` publicada e acessível.
2. `npm ci && npm run build && npm run preview` funciona em checkout limpo.
3. `npm run test:e2e` verde (52/52).
4. URL pública abre, navega, faz login, compra e confirma.
5. Deep link e refresh funcionam na URL publicada.
6. `mockServiceWorker.js` responde 200 e o socket conecta em produção.
7. Reprodutibilidade e decisões documentadas.
