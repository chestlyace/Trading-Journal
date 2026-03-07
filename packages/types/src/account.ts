export type AccountType = 'LIVE' | 'DEMO' | 'PROP'

export interface TradingAccount {
  id: string
  userId: string
  name: string
  broker: string | null
  currency: string
  type: AccountType
  initialBalance: number | null
  createdAt: string
  updatedAt?: string
}

