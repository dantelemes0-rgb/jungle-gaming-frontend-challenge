import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

/**
 * Auditoria Lighthouse: build de produção + preview + cenário padrão.
 * 3 medições por página/perfil, mediana, relatórios HTML/JSON.
 * Uso: npm run build && node scripts/lighthouse.mjs
 */

const PORT = 4173
const REMOTE = process.env.LH_URL
const BASE = REMOTE ?? `http://localhost:${PORT}`
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'detail', path: '/nft/nft-03' },
]
const PROFILES = ['desktop', 'mobile']
const RUNS = 3
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

mkdirSync('lighthouse/reports', { recursive: true })

async function waitForServer(url, timeoutMs = 60_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // servidor ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Preview não respondeu em ${url}`)
}

const server = REMOTE
  ? null
  : spawn(
      process.execPath,
      ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'],
      { stdio: 'ignore' },
    )

let chrome

try {
  if (!REMOTE) await waitForServer(BASE)
  chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
    chromePath: process.env.CHROME_PATH || undefined,
  })

  const rows = []

  for (const profile of PROFILES) {
    for (const page of PAGES) {
      const scores = Object.fromEntries(CATEGORIES.map((key) => [key, []]))
      const metrics = { lcp: [], cls: [], tbt: [] }

      for (let run = 1; run <= RUNS; run += 1) {
        const options = {
          port: chrome.port,
          output: ['html', 'json'],
          logLevel: 'error',
          onlyCategories: CATEGORIES,
          ...(profile === 'desktop'
            ? { preset: 'desktop' }
            : {
                formFactor: 'mobile',
                screenEmulation: {
                  mobile: true,
                  width: 390,
                  height: 844,
                  deviceScaleFactor: 3,
                  disabled: false,
                },
              }),
        }

        const result = await lighthouse(`${BASE}${page.path}`, options)
        const base = `lighthouse/reports/${profile}-${page.name}-${run}`
        writeFileSync(`${base}.html`, result.report[0])
        writeFileSync(`${base}.json`, result.report[1])

        for (const key of CATEGORIES) {
          const score = result.lhr.categories[key]?.score
          if (score != null) scores[key].push(Math.round(score * 100))
        }

        metrics.lcp.push(result.lhr.audits['largest-contentful-paint']?.numericValue ?? 0)
        metrics.cls.push(result.lhr.audits['cumulative-layout-shift']?.numericValue ?? 0)
        metrics.tbt.push(result.lhr.audits['total-blocking-time']?.numericValue ?? 0)

        const audits = result.lhr.audits
        console.log(
          `${profile}/${page.name} #${run}: ` +
            CATEGORIES.map((key) => `${key}=${Math.round((result.lhr.categories[key]?.score ?? 0) * 100)}`).join(' ') +
            ` | LCP=${audits['largest-contentful-paint']?.displayValue} CLS=${audits['cumulative-layout-shift']?.displayValue} TBT=${audits['total-blocking-time']?.displayValue}`,
        )
      }

      const medianOf = (values) => {
        const sorted = [...values].sort((a, b) => a - b)
        return sorted[Math.floor(sorted.length / 2)] ?? 0
      }
      const median = Object.fromEntries(
        Object.entries(scores).map(([key, values]) => [key, medianOf(values)]),
      )
      rows.push({
        profile,
        page: page.name,
        median,
        lcp: (medianOf(metrics.lcp) / 1000).toFixed(1),
        cls: medianOf(metrics.cls).toFixed(3),
        tbt: Math.round(medianOf(metrics.tbt)),
      })
    }
  }

  const header =
    '| Perfil | Página | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |\n|---|---|---:|---:|---:|---:|---:|---:|---:|'
  const body = rows
    .map(
      (row) =>
        `| ${row.profile} | ${row.page} | ${row.median.performance} | ${row.median.accessibility} | ${row.median['best-practices']} | ${row.median.seo} | ${row.lcp} s | ${row.cls} | ${row.tbt} ms |`,
    )
    .join('\n')

  writeFileSync(
    'lighthouse/reports/summary.md',
    `# Lighthouse — mediana de ${RUNS} execuções\n\n` +
      `Ambiente: ${BASE} · ${process.platform} · Node ${process.version} · Chrome headless\n` +
      `Build: \`npm run build\` · Cenário: \`default\`\n\n${header}\n${body}\n`,
  )

  console.log('\nResumo salvo em lighthouse/reports/summary.md')
  console.log(`${header}\n${body}`)
} finally {
  if (chrome) await chrome.kill()
  server?.kill()
}
