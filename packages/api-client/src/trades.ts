import type { Trade, PaginatedResponse, TradeFilters } from '@tradge/types'
import { api } from './client'

export interface CreateTradePayload {
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
  fees?: number
  riskAmount?: number
  session?: Trade['session']
  emotionalState?: Trade['emotionalState']
  tradeRating?: number
  notes?: string
  isDraft?: boolean
  strategyTags?: string[]
  mistakeTags?: string[]
}

export interface UpdateTradePayload extends Partial<CreateTradePayload> {}

export const tradesApi = {
  async list(filters: TradeFilters): Promise<PaginatedResponse<Trade>> {
    const { data } = await api.get<PaginatedResponse<Trade>>('/trades', {
      params: filters,
    })
    return data
  },

  async getById(id: string): Promise<Trade> {
    const { data } = await api.get<Trade>(`/trades/${id}`)
    return data
  },

  async create(payload: CreateTradePayload): Promise<Trade> {
    const { data } = await api.post<Trade>('/trades', payload)
    return data
  },

  async update(id: string, payload: UpdateTradePayload): Promise<Trade> {
    const { data } = await api.put<Trade>(`/trades/${id}`, payload)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/trades/${id}`)
  },

  async addImage(
    id: string,
    imageBase64: string,
    mimeType: string
  ): Promise<void> {
    await api.post(`/trades/${id}/images`, {
      image: imageBase64,
      mimeType,
    })
  },

  async deleteImage(tradeId: string, imageId: string): Promise<void> {
    await api.delete(`/trades/${tradeId}/images/${imageId}`)
  },
}

