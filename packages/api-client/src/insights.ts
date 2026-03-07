import type { AIInsight } from '@tradge/types'
import { api } from './client'

export interface InsightsListResponse {
  data: AIInsight[]
  hasMore: boolean
}

export const insightsApi = {
  async list(params?: { page?: number; pageSize?: number }): Promise<InsightsListResponse> {
    const { data } = await api.get<InsightsListResponse>('/insights', {
      params,
    })
    return data
  },

  async generate(): Promise<void> {
    await api.post('/insights/generate', {})
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/insights/${id}`, { isRead: true })
  },

  async dismiss(id: string): Promise<void> {
    await api.patch(`/insights/${id}`, { isDismissed: true })
  },

  async chat(message: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
    const { data } = await api.post<{ reply: string }>('/insights/chat', {
      message,
      history,
    })
    return data.reply
  },
}

