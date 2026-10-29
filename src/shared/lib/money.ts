import Decimal from 'decimal.js'

export type EthAmount = string

const ETH_PREFIX = 'Ξ'

export function toDecimal(value: EthAmount | number): Decimal {
  return new Decimal(value)
}

/** Soma exata de valores em ETH, preservando string decimal. */
export function sumEth(...values: EthAmount[]): EthAmount {
  return values
    .reduce((acc, value) => acc.plus(new Decimal(value)), new Decimal(0))
    .toFixed()
}

export function multiplyEth(price: EthAmount, qty: number): EthAmount {
  return new Decimal(price).times(qty).toFixed()
}

export function subtractEth(a: EthAmount, b: EthAmount): EthAmount {
  return new Decimal(a).minus(b).toFixed()
}

export function compareEth(a: EthAmount, b: EthAmount): number {
  return new Decimal(a).comparedTo(b)
}

export function isZeroEth(value: EthAmount): boolean {
  return new Decimal(value).isZero()
}

/**
 * Formata ETH sem passar por float: separa parte inteira (BigInt) e fracionária (string).
 * Evita perda de precisão na apresentação.
 */
export function formatEth(value: EthAmount, maxFractionDigits = 4): string {
  const normalized = normalizeEth(value)
  const [intPart = '0', fracPart = ''] = normalized.split('.')
  const grouped = new Intl.NumberFormat('pt-BR').format(BigInt(intPart))
  const fraction = fracPart.slice(0, maxFractionDigits).replace(/0+$/, '')
  return fraction.length > 0 ? `${grouped},${fraction}` : grouped
}

export function formatEthWithSymbol(value: EthAmount, maxFractionDigits = 4): string {
  return `${ETH_PREFIX} ${formatEth(value, maxFractionDigits)}`
}

export function normalizeEth(value: EthAmount): string {
  const decimal = new Decimal(value)
  if (decimal.isNegative()) return '0'
  const fixed = decimal.toFixed(18, Decimal.ROUND_DOWN)
  const [intPart = '0', fracPart = ''] = fixed.split('.')
  const trimmedFrac = fracPart.replace(/0+$/, '')
  return trimmedFrac ? `${intPart}.${trimmedFrac}` : intPart
}

/** Percentual de desconto (0–100) como inteiro, a partir de dois totais. */
export function discountPercent(subtotal: EthAmount, discount: EthAmount): number {
  if (isZeroEth(subtotal)) return 0
  return new Decimal(discount).div(subtotal).times(100).toDecimalPlaces(0).toNumber()
}
