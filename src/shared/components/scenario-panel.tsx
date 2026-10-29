import { useEffect, useState } from 'react'
import { FlaskConical, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SCENARIOS, getScenario, type ScenarioId } from '@/mocks/scenarios'
import { http } from '@/shared/api/http'

/**
 * Painel de desenvolvimento: troca o cenário de mock e reseta o estado.
 * Só aparece quando os mocks estão ativos (build de demonstração).
 */
export function ScenarioPanel() {
  const [open, setOpen] = useState(false)
  const [scenario, setScenario] = useState<ScenarioId>(getScenario())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setScenario(getScenario())
  }, [open])

  const change = async (next: ScenarioId) => {
    setBusy(true)
    try {
      await http.post('/__mock/scenario', { scenario: next })
      setScenario(next)
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    setBusy(true)
    try {
      await http.post('/__mock/reset', { scenario })
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-30 shadow-[var(--shadow-pop)]"
        aria-label="Abrir painel de cenários de simulação"
      >
        <FlaskConical aria-hidden="true" />
        Cenário: {scenario}
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-30 w-72 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-pop)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm font-semibold">Cenários de simulação</p>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Fechar
        </Button>
      </div>

      <Select value={scenario} onValueChange={(value) => void change(value as ScenarioId)}>
        <SelectTrigger aria-label="Selecionar cenário">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SCENARIOS.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="mt-2 text-xs text-text-muted">
        {SCENARIOS.find((item) => item.id === scenario)?.description}
      </p>

      <Button
        variant="secondary"
        size="sm"
        className="mt-3 w-full"
        onClick={() => void reset()}
        disabled={busy}
      >
        <RotateCcw aria-hidden="true" />
        Resetar dados do cenário
      </Button>
    </div>
  )
}
