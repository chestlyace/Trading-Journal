export function calculateGrossPnl(
  direction: 'LONG' | 'SHORT',
  entryPrice: number,
  exitPrice: number,
  positionSize: number,
  assetClass: string
): number {
  const priceDiff =
    direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice

  // For now we keep assetClass handling simple and return raw difference * size.
  // More precise per-asset-class logic can be added later without changing the signature.
  return priceDiff * positionSize
}

export function calculateRRRatio(
  direction: 'LONG' | 'SHORT',
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number {
  const risk = Math.abs(entryPrice - stopLoss)
  const reward = Math.abs(takeProfit - entryPrice)
  if (risk === 0) return 0
  return Number((reward / risk).toFixed(2))
}

export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0
  return Number(((wins / total) * 100).toFixed(1))
}

export function calculateExpectancy(
  winRate: number,
  avgWin: number,
  avgLoss: number
): number {
  const lossRate = 1 - winRate / 100
  return (winRate / 100) * avgWin - lossRate * Math.abs(avgLoss)
}

export function calculateMaxDrawdown(equityCurve: number[]): number {
  if (!equityCurve.length) return 0
  let peak = equityCurve[0]
  let maxDD = 0
  for (const value of equityCurve) {
    if (value > peak) peak = value
    const dd = ((peak - value) / peak) * 100
    if (dd > maxDD) maxDD = dd
  }
  return Number(maxDD.toFixed(2))
}

