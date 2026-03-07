import type {
  AssetClass,
  Direction,
  TradeOutcome,
  TradingSession,
} from './trade'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
  details?: Record<string, string[]>
}

export interface TradeFilters {
  accountId?: string
  assetClass?: AssetClass
  direction?: Direction
  outcome?: TradeOutcome
  session?: TradingSession
  strategy?: string
  instrument?: string
  from?: string
  to?: string
  search?: string
  isOpen?: boolean
  page?: number
  pageSize?: number
  sortBy?: 'entryTime' | 'netPnl' | 'rrRatio' | 'tradeRating'
  sortOrder?: 'asc' | 'desc'
}

