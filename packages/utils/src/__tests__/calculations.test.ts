import { describe, it, expect } from 'vitest'
import {
  calculateGrossPnl,
  calculateRRRatio,
  calculateWinRate,
  calculateExpectancy,
  calculateMaxDrawdown,
} from '../calculations'

describe('calculateGrossPnl', () => {
  it('calculates profit for a long trade', () => {
    const pnl = calculateGrossPnl('LONG', 1.0842, 1.0876, 0.5, 'FOREX')
    expect(pnl).toBeCloseTo(0.5 * (1.0876 - 1.0842))
  })

  it('calculates profit for a short trade', () => {
    const pnl = calculateGrossPnl('SHORT', 1.0876, 1.0842, 0.5, 'FOREX')
    expect(pnl).toBeCloseTo(0.5 * (1.0876 - 1.0842))
  })

  it('returns negative for a losing long trade', () => {
    const pnl = calculateGrossPnl('LONG', 1.0876, 1.0842, 1.0, 'FOREX')
    expect(pnl).toBeLessThan(0)
  })
})

describe('calculateRRRatio', () => {
  it('calculates 1:2 ratio correctly', () => {
    const rr = calculateRRRatio('LONG', 100, 98, 104)
    expect(rr).toBe(2)
  })
})

describe('calculateWinRate', () => {
  it('returns 0 for no trades', () => {
    expect(calculateWinRate(0, 0)).toBe(0)
  })

  it('calculates 66.7% for 2 wins from 3 trades', () => {
    expect(calculateWinRate(2, 3)).toBe(66.7)
  })
})

describe('calculateExpectancy', () => {
  it('computes expectancy from win rate and avg win/loss', () => {
    const result = calculateExpectancy(50, 200, -100)
    expect(result).toBeGreaterThan(0)
  })
})

describe('calculateMaxDrawdown', () => {
  it('returns 0 for empty curve', () => {
    expect(calculateMaxDrawdown([])).toBe(0)
  })

  it('computes max drawdown percentage', () => {
    const curve = [1000, 1100, 900, 950, 800]
    const dd = calculateMaxDrawdown(curve)
    expect(dd).toBeGreaterThan(0)
  })
})

