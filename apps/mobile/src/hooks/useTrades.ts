import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tradesApi } from '@tradge/api-client'
import type { TradeFilters, Trade } from '@tradge/types'

export const tradeKeys = {
  all: ['trades'] as const,
  lists: () => [...tradeKeys.all, 'list'] as const,
  list: (filters: TradeFilters) => [...tradeKeys.lists(), filters] as const,
  details: () => [...tradeKeys.all, 'detail'] as const,
  detail: (id: string) => [...tradeKeys.details(), id] as const,
}

export function useTrades(filters: TradeFilters) {
  return useQuery({
    queryKey: tradeKeys.list(filters),
    queryFn: () => tradesApi.list(filters),
  })
}

export function useTrade(id: string) {
  return useQuery({
    queryKey: tradeKeys.detail(id),
    queryFn: () => tradesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateTrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tradesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.all })
    },
  })
}

