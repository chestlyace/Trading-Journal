import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@tradge/api-client'

export const dashboardKeys = {
  stats: (params: { accountId?: string; from?: string; to?: string }) =>
    ['dashboard', 'stats', params] as const,
  equity: (params: { accountId?: string; from?: string; to?: string }) =>
    ['dashboard', 'equity', params] as const,
}

export function useDashboardStats(params: {
  accountId?: string
  from?: string
  to?: string
}) {
  return useQuery({
    queryKey: dashboardKeys.stats(params),
    queryFn: () => dashboardApi.getStats(params),
  })
}

export function useEquityCurve(params: {
  accountId?: string
  from?: string
  to?: string
}) {
  return useQuery({
    queryKey: dashboardKeys.equity(params),
    queryFn: () => dashboardApi.getEquityCurve(params),
  })
}

