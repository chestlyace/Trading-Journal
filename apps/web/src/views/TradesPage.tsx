import React, { useState } from 'react'
import type { TradeFilters } from '@tradge/types'
import { useTrades } from '../hooks/useTrades'

export function TradesPage() {
  const [filters] = useState<TradeFilters>({})
  const { data, isLoading } = useTrades(filters)

  if (isLoading) return <div>Loading trades...</div>

  const trades = data?.data ?? []

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1>Trades</h1>
      {trades.length === 0 ? (
        <p>No trades yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Instrument</th>
              <th>Direction</th>
              <th>Net P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.entryTime).toLocaleString()}</td>
                <td>{t.instrument}</td>
                <td>{t.direction}</td>
                <td>{t.netPnl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

