import { mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

/**
 * Auditoria Lighthouse: build de produção + preview + cenário padrão dos mocks.
 * Roda 3 medições por página/perfil e grava HTML/JSON + resumo com a mediana.
 * Uso: npm run build && npm run audit:lighthouse
 */

const PORT = 4173
const BASE = `http://localhost:${PORT}`
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'detail', path: '/nft/nft-03' },
]
const PROFILES = ['desktop', 'mobile']
const RUNS = 3

mkdirSync('lighthouse/reports', { recursive: true })

const server = spawnSync('npx', ['vite', 'preview', '--port', String(PORT)], {
  shell: true,
  detached: true,
  stdio: 'ignore',
})

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })

const summary = []

try {
  for (const profile of PROFILES) {
    for (const page of PAGES) {
      const scores = { performance: [], accessibility: [], 'best-practices': [], seo: [] }

      for (let run = 1; run <= RUNS; run += 1) {
        const result = await lighthouse(`${BASE}${page.path}`, {
          port: chrome.port,
          output: ['html', 'json'],
          logLevel: 'error',
          formFactor: profile === 'mobile' ? 'mobile' : 'desktop',
          screenEmulation:
            profile === 'mobile'
              ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false }
              : { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        })

        const lhr = result.lhr
        const base = `lighthouse/reports/${profile}-${page.name}-${run}`
        writeFileSync(`${base}.html`, result.report[0])
        writeFileSync(`${base}.json`, result.report[1])

        for (const key of Object.keys(scores)) {
          const category = lhr.categories[key]
          if (category?.score != null) scores[key].push(Math.round(category.score * 100))
        }
      }

      const median = Object.fromEntries(
        Object.entries(scores).map(([key, values]) => {
          const sorted = [...values].sort((a, b) => a - b)
          return [key, sorted[Math.floor(sorted.length / 2)] ?? 0]
        }),
      )
      summary.push({ profile, page: page.name, median, runs: scores })
    }
  }

  const header = '| Perfil | Página | Performance | A11y | Boas práticas | SEO |\n|---|---|---:|---:|---:|---:|'
  const rows = summary.map(
    (item) =>
      `| ${item.profile} | ${item.page} | ${item.median.performance} | ${item.median.accessibility} | ${item.median['best-practices']} | ${item.median.seo} |`,
  )
  writeFileSync(
    'lighthouse/reports/summary.md',
    `# Lighthouse — mediana de ${RUNS} execuções\n\n${header}\n${rows.join('\n')}\n`,
  )
  console.log(rows.join('\n'))
} finally {
  await chrome.kill()
  if (server.pid) {
    try {
      process.kill(-server.pid)
    } catch {
      // processo já encerrado
    }
  }
}
