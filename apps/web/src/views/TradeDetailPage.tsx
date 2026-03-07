import React from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTrade } from '../hooks/useTrades'

export function TradeDetailPage() {
  const router = useRouter()
  const id = router.parseLocation().pathname.split('/').pop() || ''
  const { data, isLoading } = useTrade(id)

  if (isLoading) return <div>Loading trade...</div>
  if (!data) return <div>Trade not found.</div>

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1>Trade {data.instrument}</h1>
      <p>Direction: {data.direction}</p>
      <p>Entry: {data.entryPrice}</p>
      <p>Exit: {data.exitPrice}</p>
      <p>Net P&amp;L: {data.netPnl}</p>
    </div>
  )
}

