/**
 * Portão de inicialização dos mocks.
 * O app pode renderizar antes do MSW terminar de subir; as chamadas HTTP
 * aguardam esta promise, evitando requests que escapem para a rede.
 */
let gate: Promise<void> | null = null

export function setMocksGate(promise: Promise<void>): void {
  gate = promise
}

export async function waitForMocks(): Promise<void> {
  if (gate) await gate
}
