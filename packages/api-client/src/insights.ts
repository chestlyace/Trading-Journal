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

  async update(
    id: string,
    updates: { isRead?: boolean; isDismissed?: boolean }
  ): Promise<void> {
    await api.patch(`/insights/${id}`, updates)
  },

  async listChatSessions(): Promise<any[]> {
    const { data } = await api.get('/insights/chat/sessions')
    return data
  },

  async createChatSession(title?: string): Promise<any> {
    const { data } = await api.post('/insights/chat/sessions', { title })
    return data
  },

  async getChatHistory(sessionId: string): Promise<any[]> {
    const { data } = await api.get(`/insights/chat/sessions/${sessionId}/history`)
    return data
  },

  async sendMessage(sessionId: string, message: string): Promise<any> {
    const { data } = await api.post(
      `/insights/chat/sessions/${sessionId}/messages`,
      { message }
    )
    return data
  },

  async chat(
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<string> {
    const { data } = await api.post<{ reply: string }>('/insights/chat', {
      message,
      history,
    })
    return data.reply
  },
}

