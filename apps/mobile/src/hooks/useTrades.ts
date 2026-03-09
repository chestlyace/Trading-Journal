import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tradesApi } from '@tradge/api-client'
import type { TradeFilters, Trade } from '@tradge/types'
import { supabase } from '../lib/supabase'

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
    queryFn: async () => {
      let query = supabase
        .from('trades')
        .select('*, tags:trade_tags(*)', { count: 'exact' })
        .eq('is_draft', false)

      if (filters.accountId) query = query.eq('account_id', filters.accountId)
      if (filters.assetClass) query = query.eq('asset_class', filters.assetClass)
      if (filters.outcome) query = query.eq('outcome', filters.outcome)
      if (filters.from) query = query.gte('entry_time', filters.from)
      if (filters.to) query = query.lte('entry_time', filters.to)
      if (filters.isOpen !== undefined) {
        query = query.eq('is_open', filters.isOpen)
      }

      if (filters.search) {
        query = query.or(`instrument.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
      }

      const sortColumn = {
        entryTime: 'entry_time',
        netPnl: 'net_pnl',
        rrRatio: 'rr_ratio',
        tradeRating: 'trade_rating',
      }[filters.sortBy ?? 'entryTime'] ?? 'entry_time'

      query = query.order(sortColumn, {
        ascending: filters.sortOrder === 'asc',
      })

      const page = filters.page ?? 1
      const pageSize = filters.pageSize ?? 50
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count, error } = await query.range(from, to)

      if (error) {
        throw new Error(error.message)
      }

      const mapped = (data || []).map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        accountId: t.account_id,
        instrument: t.instrument,
        assetClass: t.asset_class,
        direction: t.direction,
        entryPrice: t.entry_price,
        exitPrice: t.exit_price,
        entryTime: t.entry_time,
        exitTime: t.exit_time,
        positionSize: t.position_size,
        stopLoss: t.stop_loss,
        takeProfit: t.take_profit,
        grossPnl: t.gross_pnl,
        fees: t.fees,
        netPnl: t.net_pnl,
        riskAmount: t.risk_amount,
        rrRatio: t.rr_ratio,
        outcome: t.outcome,
        emotionalState: t.emotional_state,
        session: t.session,
        tradeRating: t.trade_rating,
        notes: t.notes,
        isOpen: t.is_open,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        tags: t.tags?.map((tag: any) => ({
          id: tag.id,
          tradeId: tag.trade_id,
          tagType: tag.tag_type,
          tagValue: tag.tag_value,
        })),
        images: []
      }))

      return {
        data: mapped,
        total: count ?? 0,
        page,
        pageSize,
        hasMore: (count ?? 0) > page * pageSize,
      }
    },
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

