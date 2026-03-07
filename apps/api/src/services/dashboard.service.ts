import { supabaseAdmin } from '../lib/supabase'

export interface DashboardStats {
  totalTrades: number
  closedTrades: number
  wins: number
  losses: number
  breakEvens: number
  winRatePct: number
  totalNetPnl: number
  avgWin: number | null
  avgLoss: number | null
  avgRrRatio: number | null
  bestTradePnl: number | null
  worstTradePnl: number | null
  avgRating: number | null
}

export interface EquityPoint {
  tradeDate: string
  dailyPnl: number
  cumulativePnl: number
}

export class DashboardService {
  static async getStats(userId: string, opts: { accountId?: string; from?: string; to?: string }): Promise<DashboardStats> {
    let query = supabaseAdmin
      .from('trades')
      .select('net_pnl, outcome, rr_ratio, trade_rating, entry_time, is_open', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_draft', false)

    if (opts.accountId) query = query.eq('account_id', opts.accountId)
    if (opts.from) query = query.gte('entry_time', opts.from)
    if (opts.to) query = query.lte('entry_time', opts.to)

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch dashboard stats: ${error.message}`)

    const trades = data ?? []
    const closed = trades.filter((t: any) => !t.is_open && t.net_pnl !== null)
    const wins = closed.filter((t: any) => t.outcome === 'WIN')
    const losses = closed.filter((t: any) => t.outcome === 'LOSS')
    const breakEvens = closed.filter((t: any) => t.outcome === 'BREAK_EVEN')

    const totalNetPnl = closed.reduce((sum: number, t: any) => sum + (t.net_pnl ?? 0), 0)
    const avgWin = wins.length
      ? wins.reduce((sum: number, t: any) => sum + (t.net_pnl ?? 0), 0) / wins.length
      : null
    const avgLoss = losses.length
      ? losses.reduce((sum: number, t: any) => sum + (t.net_pnl ?? 0), 0) / losses.length
      : null
    const avgRrRatio =
      closed.length &&
      closed.some((t: any) => t.rr_ratio !== null && t.rr_ratio !== undefined)
        ? closed.reduce((sum: number, t: any) => sum + (t.rr_ratio ?? 0), 0) / closed.length
        : null

    const bestTradePnl =
      closed.length > 0
        ? closed.reduce(
            (max: number | null, t: any) =>
              max === null || (t.net_pnl ?? 0) > max ? t.net_pnl ?? 0 : max,
            null as number | null
          )
        : null

    const worstTradePnl =
      closed.length > 0
        ? closed.reduce(
            (min: number | null, t: any) =>
              min === null || (t.net_pnl ?? 0) < min ? t.net_pnl ?? 0 : min,
            null as number | null
          )
        : null

    const avgRating =
      closed.length &&
      closed.some((t: any) => t.trade_rating !== null && t.trade_rating !== undefined)
        ? closed.reduce((sum: number, t: any) => sum + (t.trade_rating ?? 0), 0) / closed.length
        : null

    const winRatePct =
      closed.length > 0 ? (wins.length / closed.length) * 100 : 0

    return {
      totalTrades: trades.length,
      closedTrades: closed.length,
      wins: wins.length,
      losses: losses.length,
      breakEvens: breakEvens.length,
      winRatePct: Number(winRatePct.toFixed(1)),
      totalNetPnl: Number(totalNetPnl.toFixed(2)),
      avgWin: avgWin !== null ? Number(avgWin.toFixed(2)) : null,
      avgLoss: avgLoss !== null ? Number(avgLoss.toFixed(2)) : null,
      avgRrRatio: avgRrRatio !== null ? Number(avgRrRatio.toFixed(2)) : null,
      bestTradePnl: bestTradePnl !== null ? Number(bestTradePnl.toFixed(2)) : null,
      worstTradePnl: worstTradePnl !== null ? Number(worstTradePnl.toFixed(2)) : null,
      avgRating: avgRating !== null ? Number(avgRating.toFixed(2)) : null,
    }
  }

  static async getEquityCurve(
    userId: string,
    opts: { accountId?: string; from?: string; to?: string }
  ): Promise<EquityPoint[]> {
    let query = supabaseAdmin
      .from('trades')
      .select('entry_time, net_pnl, is_open')
      .eq('user_id', userId)
      .eq('is_draft', false)
      .eq('is_open', false)
      .not('net_pnl', 'is', null)

    if (opts.accountId) query = query.eq('account_id', opts.accountId)
    if (opts.from) query = query.gte('entry_time', opts.from)
    if (opts.to) query = query.lte('entry_time', opts.to)

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch equity curve: ${error.message}`)

    const byDate = new Map<string, number>()
    for (const row of data ?? []) {
      const dateKey = new Date(row.entry_time as string).toISOString().slice(0, 10)
      const current = byDate.get(dateKey) ?? 0
      byDate.set(dateKey, current + (row.net_pnl ?? 0))
    }

    const sortedDates = Array.from(byDate.keys()).sort()
    let cumulative = 0
    const points: EquityPoint[] = []
    for (const d of sortedDates) {
      const daily = byDate.get(d) ?? 0
      cumulative += daily
      points.push({
        tradeDate: d,
        dailyPnl: Number(daily.toFixed(2)),
        cumulativePnl: Number(cumulative.toFixed(2)),
      })
    }

    return points
  }
}

