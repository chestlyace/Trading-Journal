import React, { useState } from 'react'
import { useDashboardStats, useEquityCurve } from '../hooks/useDashboard'

export function DashboardPage() {
  const [range] = useState<{ from?: string; to?: string }>({})
  const statsQuery = useDashboardStats(range)
  const equityQuery = useEquityCurve(range)

  if (statsQuery.isLoading || equityQuery.isLoading) {
    return <div style={{ padding: '1.5rem' }}>Loading dashboard...</div>
  }

  const stats = statsQuery.data
  const equity = equityQuery.data ?? []

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1>Dashboard</h1>
      {stats && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <div>Total trades</div>
            <strong>{stats.totalTrades}</strong>
          </div>
          <div>
            <div>Win rate</div>
            <strong>{stats.winRatePct.toFixed(1)}%</strong>
          </div>
          <div>
            <div>Net P&amp;L</div>
            <strong>{stats.totalNetPnl.toFixed(2)}</strong>
          </div>
        </div>
      )}
      <div style={{ marginTop: '2rem' }}>
        <h2>Equity curve</h2>
        {equity.length === 0 ? (
          <p>No closed trades yet.</p>
        ) : (
          <ul>
            {equity.map((p) => (
              <li key={p.tradeDate}>
                {p.tradeDate}: {p.cumulativePnl.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

