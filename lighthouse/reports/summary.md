# Lighthouse — mediana de 3 execuções

Ambiente: Windows 11 · Node v24.19.0 · Lighthouse 13.6 · Chrome headless
Build: `npm run build` (produção) · Cenário: `default` · Sem throttling customizado

| Perfil | Página | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| desktop | home | 69 | 100 | 100 | 100 | 4.5 s | 0.000 | 633 ms |
| desktop | detail | 79 | 100 | 100 | 100 | 4.1 s | 0.000 | 299 ms |
| mobile | home | 72 | 100 | 100 | 100 | 4.4 s | 0.051 | 478 ms |
| mobile | detail | 82 | 100 | 100 | 100 | 4.1 s | 0.000 | 255 ms |

## Metas do desafio

| Categoria | Meta | Resultado |
|---|---:|---|
| Performance | ≥ 90 | ❌ 69–82 |
| Acessibilidade | ≥ 95 | ✅ 100 |
| Boas práticas | ≥ 95 | ✅ 100 |
| SEO | ≥ 90 | ✅ 100 |

## Causas do Performance abaixo da meta

1. **SPA sem SSR**: o HTML inicial é vazio; o LCP só existe depois de baixar o JS,
   executar o React e resolver as consultas (CSR).
2. **MSW no bundle de demonstração**: o mock é o "backend" e adiciona ~107 KB gzip
   de JavaScript ao boot (requisito do desafio: mocks ativos no build publicado).
3. **Grade de imagens do hero + catálogo**: 4 imagens no hero e 12 cards na primeira
   dobra; mesmo com `loading=lazy`, o decode concorre com o thread principal.
4. **TBT**: parse/execução dos chunks (router ~130 KB gzip, MSW ~107 KB gzip) sob
   throttling de CPU do Lighthouse.

## O que já foi corrigido nesta rodada

- CLS do detalhe: 0,352 → 0 (skeleton passou a espelhar o layout final).
- CLS do início: 0,118 → 0 (altura do hero reservada com skeletons).
- SEO: 92 → 100 (robots.txt + sitemap).
- O boot do MSW deixou de bloquear o primeiro render (gate no Axios).

## Remediação proposta (fora do escopo atual)

- Pré-render/SSG das rotas públicas (LCP sem depender do bundle).
- Carregar o MSW apenas em um worker separado ou sob demanda pós-paint.
- Code splitting mais agressivo + `manualChunks` para vendor.
- Imagens responsivas (`srcset`) e AVIF/WebP em vez de SVG pesado no hero.
