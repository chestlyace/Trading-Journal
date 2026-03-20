import { create } from 'zustand'

export interface TradeFormState {
    // Step 1: Definition
    instrument: string
    assetClass: 'CRYPTO' | 'FOREX' | 'STOCKS' | 'COMMODITIES' | ''
    direction: 'LONG' | 'SHORT'

    // Step 2: Timing & Price
    entryTime: string
    entryPrice: string
    accountId: string

    // Step 3: Exit Details
    exitTime: string
    exitPrice: string

    // Step 4: Position Risk
    positionSize: string
    stopLoss: string
    takeProfit: string
    fees: string

    // Step 5: Classification
    strategyTags: string[]
    sessionFocus: string
    emotionalState: string
    rating: number

    // Step 6: Review / Notes
    notes: string
    voiceNotes: Array<{
        uri: string
        duration: number
        mimeType: string
    }>

    // Methods
    updateField: <K extends keyof Omit<TradeFormState, 'updateField' | 'reset'>>(field: K, value: TradeFormState[K]) => void
    reset: () => void
}

const initialState = {
    instrument: '',
    assetClass: '' as const,
    direction: 'LONG' as const,
    entryTime: new Date().toISOString().slice(0, 16),
    entryPrice: '',
    accountId: '',
    exitTime: '',
    exitPrice: '',
    positionSize: '',
    stopLoss: '',
    takeProfit: '',
    fees: '',
    strategyTags: [],
    sessionFocus: '',
    emotionalState: '',
    rating: 0,
    notes: '',
    voiceNotes: [],
}

export const useTradeFormStore = create<TradeFormState>((set) => ({
    ...initialState,
    updateField: (field, value) => set((state) => ({ ...state, [field]: value })),
    reset: () => set(initialState),
}))
