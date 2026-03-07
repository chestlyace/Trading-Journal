import type { TradingAccount } from '@tradge/types'
import { api } from './client'

export interface CreateAccountPayload {
  name: string
  broker?: string | null
  currency: string
  type: TradingAccount['type']
  initialBalance?: number | null
}

export interface UpdateAccountPayload extends Partial<CreateAccountPayload> {}

export const accountsApi = {
  async list(): Promise<TradingAccount[]> {
    const { data } = await api.get<TradingAccount[]>('/accounts')
    return data
  },

  async create(payload: CreateAccountPayload): Promise<TradingAccount> {
    const { data } = await api.post<TradingAccount>('/accounts', payload)
    return data
  },

  async update(
    id: string,
    payload: UpdateAccountPayload
  ): Promise<TradingAccount> {
    const { data } = await api.put<TradingAccount>(`/accounts/${id}`, payload)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`)
  },
}

