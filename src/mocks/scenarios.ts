export type ScenarioId =
  | 'default'
  | 'empty-catalog'
  | 'slow'
  | 'variable-latency'
  | 'http-500'
  | 'offline'
  | 'session-expired'
  | 'register-conflict'
  | 'favorite-failure'
  | 'coupon-invalid'
  | 'coupon-expired'
  | 'price-changed'
  | 'edition-sold-out'
  | 'order-timeout'
  | 'payment-declined'
  | 'socket-drop'
  | 'duplicate-events'
  | 'stale-events'

export const SCENARIOS: Array<{ id: ScenarioId; label: string; description: string }> = [
  { id: 'default', label: 'Padrão', description: 'Tudo funcionando, latência baixa.' },
  { id: 'empty-catalog', label: 'Catálogo vazio', description: 'Nenhum resultado para os filtros.' },
  { id: 'slow', label: 'Lento (2,5 s)', description: 'Exercita skeletons.' },
  { id: 'variable-latency', label: 'Latência variável', description: 'Respostas fora de ordem.' },
  { id: 'http-500', label: 'Erro 500', description: 'Falha no catálogo.' },
  { id: 'offline', label: 'Offline', description: 'Falha de conexão.' },
  { id: 'session-expired', label: 'Sessão expirada', description: '401 em rota privada.' },
  { id: 'register-conflict', label: 'E-mail em uso', description: 'Conflito no cadastro.' },
  { id: 'favorite-failure', label: 'Falha em favoritos', description: 'Rollback otimista.' },
  { id: 'coupon-invalid', label: 'Cupom inválido', description: '422 no cupom.' },
  { id: 'coupon-expired', label: 'Cupom expirado', description: '410 no cupom.' },
  { id: 'price-changed', label: 'Preço alterado', description: 'nft.updated durante o checkout.' },
  { id: 'edition-sold-out', label: 'Edição esgotada', description: 'Estoque zera na compra.' },
  { id: 'order-timeout', label: 'Timeout no pedido', description: 'Pedido criado sem resposta.' },
  { id: 'payment-declined', label: 'Pagamento recusado', description: 'order.updated declined.' },
  { id: 'socket-drop', label: 'Queda de socket', description: 'Reconexão após 6 s.' },
  { id: 'duplicate-events', label: 'Eventos duplicados', description: 'Mesmo evento 2x.' },
  { id: 'stale-events', label: 'Eventos antigos', description: 'Versão velha após nova.' },
]

const STORAGE_KEY = 'jg.mock.scenario'
const VALID = new Set<string>(SCENARIOS.map((scenario) => scenario.id))

export function isScenario(value: string | null | undefined): value is ScenarioId {
  return Boolean(value && VALID.has(value))
}

export function getScenario(): ScenarioId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isScenario(stored) ? stored : 'default'
  } catch {
    return 'default'
  }
}

export function setScenario(scenario: ScenarioId): void {
  localStorage.setItem(STORAGE_KEY, scenario)
}

export function scenarioFromRequest(request: Request): ScenarioId {
  const header = request.headers.get('X-Mock-Scenario')
  if (isScenario(header)) return header
  return getScenario()
}
