import { supabaseAdmin } from '../lib/supabase'
import {
  calculateGrossPnl,
  calculateRRRatio,
} from '@tradge/utils'
import type { Trade, TradeFilters, PaginatedResponse } from '@tradge/types'

export interface CreateTradeInput {
  accountId: string
  instrument: string
  assetClass: Trade['assetClass']
  direction: Trade['direction']
  entryPrice: number
  exitPrice?: number
  entryTime: string
  exitTime?: string
  positionSize: number
  stopLoss?: number
  takeProfit?: number
  fees: number
  riskAmount?: number
  session?: Trade['session']
  emotionalState?: Trade['emotionalState']
  tradeRating?: number
  notes?: string
  isDraft: boolean
  strategyTags?: string[]
  mistakeTags?: string[]
}

export class TradeService {
  static async create(userId: string, data: CreateTradeInput): Promise<Trade> {
    const grossPnl =
      data.exitPrice !== undefined
        ? calculateGrossPnl(
            data.direction,
            data.entryPrice,
            data.exitPrice,
            data.positionSize,
            data.assetClass
          )
        : null

    const netPnl = grossPnl !== null ? grossPnl - data.fees : null

    const rrRatio =
      data.stopLoss !== undefined && data.takeProfit !== undefined
        ? calculateRRRatio(
            data.direction,
            data.entryPrice,
            data.stopLoss,
            data.takeProfit
          )
        : null

    const outcome =
      netPnl !== null
        ? netPnl > 0
          ? 'WIN'
          : netPnl < 0
          ? 'LOSS'
          : 'BREAK_EVEN'
        : null

    const tradeDurationMinutes =
      data.exitTime !== undefined
        ? Math.round(
            (new Date(data.exitTime).getTime() -
              new Date(data.entryTime).getTime()) /
              60000
          )
        : null

    const { data: trade, error } = await supabaseAdmin
      .from('trades')
      .insert({
        user_id: userId,
        account_id: data.accountId,
        instrument: data.instrument.toUpperCase(),
        asset_class: data.assetClass,
        direction: data.direction,
        entry_price: data.entryPrice,
        exit_price: data.exitPrice ?? null,
        entry_time: data.entryTime,
        exit_time: data.exitTime ?? null,
        position_size: data.positionSize,
        stop_loss: data.stopLoss ?? null,
        take_profit: data.takeProfit ?? null,
        fees: data.fees,
        gross_pnl: grossPnl,
        net_pnl: netPnl,
        risk_amount: data.riskAmount ?? null,
        rr_ratio: rrRatio,
        outcome,
        session: data.session ?? null,
        emotional_state: data.emotionalState ?? null,
        trade_rating: data.tradeRating ?? null,
        notes: data.notes ?? null,
        is_open: data.exitPrice === undefined,
        is_draft: data.isDraft,
        trade_duration_minutes: tradeDurationMinutes,
      })
      .select()
      .single()

    if (error || !trade) {
      throw new Error(`Failed to create trade: ${error?.message ?? 'unknown'}`)
    }

    const tagInserts = [
      ...(data.strategyTags ?? []).map((tag) => ({
        trade_id: trade.id,
        user_id: userId,
        tag_type: 'STRATEGY' as const,
        tag_value: tag,
      })),
      ...(data.mistakeTags ?? []).map((tag) => ({
        trade_id: trade.id,
        user_id: userId,
        tag_type: 'MISTAKE' as const,
        tag_value: tag,
      })),
    ]

    if (tagInserts.length > 0) {
      await supabaseAdmin.from('trade_tags').insert(tagInserts)
    }

    return (await this.getById(userId, trade.id)) as Trade
  }

  static async list(
    userId: string,
    filters: TradeFilters
  ): Promise<PaginatedResponse<Trade>> {
    let query = supabaseAdmin
      .from('trades')
      .select('*, trade_tags(*)', { count: 'exact' })
      .eq('user_id', userId)
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
      query = query.or(
        `instrument.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
      )
    }

    const sortColumn =
      {
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

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to list trades: ${error.message}`)
    }

    return {
      data: (data ?? []) as unknown as Trade[],
      total: count ?? 0,
      page,
      pageSize,
      hasMore: (count ?? 0) > page * pageSize,
    }
  }

  static async getById(userId: string, id: string): Promise<Trade | null> {
    const { data, error } = await supabaseAdmin
      .from('trades')
      .select('*, trade_tags(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return null
    return data as unknown as Trade
  }

  static async update(
    userId: string,
    id: string,
    updates: Partial<CreateTradeInput>
  ): Promise<Trade> {
    const existing = await this.getById(userId, id)
    if (!existing) {
      throw new Error('Trade not found')
    }

    const merged = { ...existing, ...updates }

    const grossPnl =
      merged.exitPrice !== null && merged.exitPrice !== undefined
        ? calculateGrossPnl(
            merged.direction,
            merged.entryPrice,
            merged.exitPrice,
            merged.positionSize,
            merged.assetClass
          )
        : null

    const netPnl = grossPnl !== null ? grossPnl - (merged.fees ?? 0) : null

    const outcome =
      netPnl !== null
        ? netPnl > 0
          ? 'WIN'
          : netPnl < 0
          ? 'LOSS'
          : 'BREAK_EVEN'
        : null

    const { error } = await supabaseAdmin
      .from('trades')
      .update({
        ...updates,
        gross_pnl: grossPnl,
        net_pnl: netPnl,
        is_open: merged.exitPrice === null || merged.exitPrice === undefined,
        outcome,
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Update failed: ${error.message}`)
    }

    return (await this.getById(userId, id)) as Trade
  }

  static async delete(userId: string, id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('trades')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }
}

