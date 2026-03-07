export type Direction = 'LONG' | 'SHORT'

export type AssetClass =
  | 'FOREX'
  | 'STOCKS'
  | 'CRYPTO'
  | 'FUTURES'
  | 'INDICES'
  | 'COMMODITIES'

export type TradeOutcome = 'WIN' | 'LOSS' | 'BREAK_EVEN' | 'PARTIAL'

export type TradingSession =
  | 'LONDON'
  | 'NEW_YORK'
  | 'ASIAN'
  | 'LONDON_NY_OVERLAP'
  | 'OTHER'

export type EmotionalState =
  | 'CALM'
  | 'ANXIOUS'
  | 'GREEDY'
  | 'FEARFUL'
  | 'CONFIDENT'
  | 'FOMO'
  | 'NEUTRAL'

export interface TradeTag {
  id: string
  tradeId: string
  tagType: 'STRATEGY' | 'MISTAKE'
  tagValue: string
}

export interface TradeImage {
  id: string
  tradeId: string
  storageUrl: string
  signedUrl?: string
  createdAt: string
}

export interface Trade {
  id: string
  userId: string
  accountId: string
  instrument: string
  assetClass: AssetClass
  direction: Direction
  entryPrice: number
  exitPrice: number | null
  entryTime: string
  exitTime: string | null
  positionSize: number
  stopLoss: number | null
  takeProfit: number | null
  grossPnl: number | null
  fees: number
  netPnl: number | null
  riskAmount: number | null
  rrRatio: number | null
  outcome: TradeOutcome | null
  emotionalState: EmotionalState | null
  session: TradingSession | null
  tradeRating: number | null
  notes: string | null
  isOpen: boolean
  createdAt: string
  updatedAt: string
  tags?: TradeTag[]
  images?: TradeImage[]
}

