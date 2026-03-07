import React, { useState } from 'react'
import { useCreateTrade } from '../hooks/useTrades'

export function NewTradePage() {
  const createTrade = useCreateTrade()
  const [instrument, setInstrument] = useState('')
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [positionSize, setPositionSize] = useState('')
  const [fees, setFees] = useState('0')
  const [accountId, setAccountId] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTrade.mutateAsync({
      accountId,
      instrument,
      assetClass: 'FOREX',
      direction,
      entryPrice: Number(entryPrice),
      exitPrice: exitPrice ? Number(exitPrice) : undefined,
      entryTime: new Date().toISOString(),
      exitTime: exitPrice ? new Date().toISOString() : undefined,
      positionSize: Number(positionSize),
      fees: Number(fees),
      isDraft: false,
      strategyTags: [],
      mistakeTags: [],
    } as any)
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1>New Trade</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label>
            Account ID
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Instrument
            <input
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Direction
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'LONG' | 'SHORT')}
            >
              <option value="LONG">Long</option>
              <option value="SHORT">Short</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Entry price
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Exit price
            <input
              type="number"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Position size
            <input
              type="number"
              value={positionSize}
              onChange={(e) => setPositionSize(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Fees
            <input
              type="number"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" disabled={createTrade.isPending}>
          Save trade
        </button>
      </form>
    </div>
  )
}

