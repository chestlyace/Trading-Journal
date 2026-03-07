import { api } from './client'

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

export const dashboardApi = {
  async getStats(params: {
    accountId?: string
    from?: string
    to?: string
  }): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/dashboard/stats', {
      params,
    })
    return data
  },

  async getEquityCurve(params: {
    accountId?: string
    from?: string
    to?: string
  }): Promise<EquityPoint[]> {
    const { data } = await api.get<EquityPoint[]>(
      '/dashboard/equity-curve',
      { params }
    )
    return data
  },
}

